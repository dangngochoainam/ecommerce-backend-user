import { Injectable } from "@nestjs/common";
import { WorkflowEntity } from "src/db-workflow/entity/workflow.entity";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { ProducerService } from "../amqp/producer.service";
import { v4 } from "uuid";
import { DEF, RootMsg } from "./workflow-type";

@Injectable()
export class WorkflowHelperService {
	protected readonly logger!: ContextLogger;
	public constructor(
		protected readonly loggerService: LoggerService,
		private readonly producerService: ProducerService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	/**
	 * Trigger a workflow service to run its operations
	 * How it's run is up to the workflow service
	 */
	public async runWorkflow(params: { wfEntity: WorkflowEntity; wfDEF: DEF }): Promise<void> {
		const { wfEntity, wfDEF } = params;

		this.logger.log(
			{
				traceId: wfEntity.correlationId,
			},
			`Distributor request execute ${wfEntity.workflowName}`,
		);

		await this.producerService.sendMessage({
			traceId: wfEntity.correlationId,
			address: wfDEF.address,
			message: JSON.stringify(new RootMsg(params.wfEntity.correlationId)),
			messageId: v4(),
			durable: true,
		});
	}

	public async listen() {}
}
