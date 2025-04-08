import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { BehaviorSubject, filter, map, Observable } from "rxjs";
import { CoreEnvironment, CoreEnvironmentService } from "../environment/environment.service";
import { LoggerService } from "../logger/logger.service";
import { IMessageEvent } from "../workflow/workflow-type";
import { IAddress, IExchange } from "./amqp.common";
import { AbstractAmqpService } from "./base-amqp.service";

@Injectable()
export class ConsumerService extends AbstractAmqpService {
	public constructor(
		protected readonly loggerService: LoggerService,
		protected readonly envService: CoreEnvironmentService<CoreEnvironment>,
	) {
		super(loggerService, envService);
	}

	public async receiveMessage<T>(options: {
		address: IAddress;
		exchange?: IExchange;
		concurrentLimit: number;
		durable: boolean;
	}): Promise<{
		source: Observable<IMessageEvent<T>>;
	}> {
		try {
			this.logger.log({}, `Registering address: ${JSON.stringify(options.address)}`);
			const subject = new BehaviorSubject("");
			const queue = await this.assertAMQPAddress(options.address, options.exchange as IExchange);
			await this.channel.prefetch(options.concurrentLimit);

			this.channel.consume(
				queue,
				(msg) => {
					if (!msg) {
						this.logger.debug({}, `Message not found on queue ${queue}`);
						return;
					}
					this.logger.debug({}, `Received message on queue ${queue}: ${msg.content.toString()}`);
					subject.next(msg.content.toString());
				},
				{
					noAck: true,
				},
			);
			return {
				source: subject.pipe(
					filter((message) => !!message),
					map((message) => message && JSON.parse(message)),
				),
			};
		} catch (error: any) {
			this.logger.error({}, `Failed to register address: ${JSON.stringify(options.address)}`, error);
			throw new InternalServerErrorException(error);
		}
	}
}
