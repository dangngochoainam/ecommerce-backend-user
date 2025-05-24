import { from, Observable, share } from "rxjs";
import { ConsumerService } from "../amqp/consumer.service";
import { ContextLogger } from "../logger/logger.service";
import { AbstractWorkflow, IMessageEvent, RootMsg } from "./workflow-type";
import { v4 } from "uuid";
import { ProducerService } from "../amqp/producer.service";

export abstract class AbstratMessaging<DEF extends AbstractWorkflow<string>> {
	protected abstract logger: ContextLogger;

	protected abstract consumerService: ConsumerService;

	protected abstract producerService: ProducerService;

	protected source!: Observable<IMessageEvent<any>>;

	public abstract DEF: DEF;

	protected async listen() {
		const { source } = await this.consumerService.receiveMessage<RootMsg>({
			address: {
				name: this.DEF.address,
				options: {
					durable: true,
				},
			},
			exchange: {
				name: this.DEF.exchange,
				routingKey: this.DEF.name,
				fanout: false,
				options: {
					durable: true,
				},
			},
			durable: true,
			concurrentLimit: 10,
		});

		this.source = from(source).pipe(share());

		source.forEach(async (message) => {
			try {
				await this.onMessage(message);
			} catch (error) {
				this.logger.error(
					{ traceId: message.parsedMessage.correlationId },
					"Error while executing workflow",
					error as Error,
				);
			}
		});
	}

	protected abstract onMessage(msgEvent: IMessageEvent<RootMsg>): Promise<void>;

	public async enqueue(msg: IMessageEvent<RootMsg>, options: { traceId: string; address: string }) {
		await this.producerService.sendMessage({
			traceId: options.traceId,
			address: options.address,
			message: JSON.stringify(msg),
			messageId: v4(),
			durable: true,
		});
	}
}
