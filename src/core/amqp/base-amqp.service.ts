import { ContextLogger, LoggerService } from "../logger/logger.service";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Channel, ChannelModel, ConfirmChannel, connect, Connection, Options } from "amqplib";
import { CoreEnvironment, CoreEnvironmentService } from "../environment/environment.service";
import { delay } from "../../shared/utils/delay";
import { IAddress, IExchange, QUEUE_ATTRIBUTE_KEY, TEMPORARY_QUEUE_LIFETIME } from "./amqp.common";

@Injectable()
export abstract class AbstractAmqpService implements OnModuleInit, OnModuleDestroy {
	protected logger!: ContextLogger;

	protected connection!: Connection;
	protected channelModel!: ChannelModel;
	protected channel!: Channel;
	protected confirmChannel!: ConfirmChannel;

	private isShuttingDown = false;

	public constructor(
		protected readonly loggerService: LoggerService,
		protected readonly envService: CoreEnvironmentService<CoreEnvironment>,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async onModuleDestroy() {
		if (this.connection) {
			this.isShuttingDown = true;
			await this.channelModel.close();
		}
	}

	public async onModuleInit() {
		const { MQ_HOSTNAME } = this.envService.ENVIRONMENT;
		const host: Options.Connect = {
			protocol: "amqp",
			hostname: MQ_HOSTNAME.split(":")[0],
			port: parseInt(MQ_HOSTNAME.split(":")[1]),
			username: this.envService.ENVIRONMENT.MQ_USERNAME,
			password: this.envService.ENVIRONMENT.MQ_PASSWORD,
		};
		await this.connect(host);
	}

	private async connect(host: Options.Connect) {
		this.channelModel = await connect(host);
		this.logger.debug({}, `[RabbitMQ] Connected to ${this.envService.ENVIRONMENT.MQ_HOSTNAME}`);
		await this.handleNewConnection(this.channelModel.connection);
		this.isShuttingDown = false;
		this.handleDisconnect(host);
	}

	private async handleNewConnection(connection: Connection) {
		this.connection = connection;
		this.channel = await this.channelModel.createChannel();
		this.confirmChannel = await this.channelModel.createConfirmChannel();
		this.connection.on("error", (e: any) => {
			this.logger.error({}, "[RabbitMQ] Connection Error", e);
		});
	}

	private handleDisconnect(host: Options.Connect) {
		this.connection.on("close", async () => {
			this.logger.warn({}, "[RabbitMQ] AMQP disconnected");
			let connected = false;
			while (!connected && !this.isShuttingDown) {
				try {
					this.logger.warn({}, "[RabbitMQ] Retry connection");
					await this.connect(host);
					connected = true;
				} catch (e) {
					await delay(3000);
				}
			}
		});
	}

	public async assertTemporaryQueue(queueName: string, expireSeconds: number = TEMPORARY_QUEUE_LIFETIME) {
		const res = await this.channel.assertQueue(queueName, {
			durable: false,
			autoDelete: true,
			expires: expireSeconds * 1000,
			arguments: {
				[QUEUE_ATTRIBUTE_KEY.QUEUE_VERSION]: 1,
			},
		});
		return res.queue;
	}

	public async assertAMQPAddress(address: IAddress, exchange: IExchange): Promise<string> {
		const { name, options } = exchange;
		this.logger.log({}, `[RabbitMQ] Asserting exchange ${name} with options ${JSON.stringify(options)}`);
		const ex = await this.channel.assertExchange(name, "topic", options);
		const addressOptions: Options.AssertQueue = {
			...address.options,
		};
		const queue = await this.channel.assertQueue(address.name, addressOptions);
		await this.channel.bindQueue(queue.queue, ex.exchange, exchange.fanout ? "#" : exchange.routingKey);
		return queue.queue;
	}
}
