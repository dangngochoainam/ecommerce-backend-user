import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CoreEnvironment, CoreEnvironmentService } from "../environment/environment.service";
import { LoggerService } from "../logger/logger.service";
import { AbstractAmqpService } from "./base-amqp.service";
import { ISendMessage, TEMPORARY_QUEUE_LIFETIME } from "./amqp.common";

@Injectable()
export class ProducerService extends AbstractAmqpService {
	public constructor(
		protected readonly loggerService: LoggerService,
		protected readonly envService: CoreEnvironmentService<CoreEnvironment>,
	) {
		super(loggerService, envService);
	}

	public async sendMessage(e: ISendMessage): Promise<void> {
		const { traceId, address } = e;
		if (!e.durable) {
			await this.assertTemporaryQueue(address, TEMPORARY_QUEUE_LIFETIME);
		}
		const msgBody = Buffer.from(e.message.toString());
		if (msgBody.byteLength / 1048576 > 5) {
			this.logger.error(
				{
					traceId: traceId,
				},
				`AMQP Message size larger than 5MB
			Address ${address}
			It could cause performance problem`,
				new InternalServerErrorException("AMQP Message size larger than 5MB"),
			);
		}

		this.logger.log(
			{
				traceId: traceId,
			},
			`Sending message to address ${address}`,
		);
		await new Promise((resolve) => {
			this.confirmChannel.sendToQueue(
				address,
				msgBody,
				{ persistent: e.durable, correlationId: traceId },
				(err, ok) => {
					if (err) {
						this.logger.error(
							{
								traceId: traceId,
							},
							`Fail to send message to address ${address}`,
							err as Error,
						);
						throw err;
					}
					resolve(ok);
				},
			);
		}).then((_) => {
			this.logger.debug({ traceId }, `Message sent to address ${address}`);
		});
	}
}
