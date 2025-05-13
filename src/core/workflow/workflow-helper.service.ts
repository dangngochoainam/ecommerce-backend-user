import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { WorkflowEntity } from "src/db-workflow/entity/workflow.entity";
import { WorkflowCoreSQLService } from "src/db-workflow/module/workflow-core/workflow-core.service";
import { v4 } from "uuid";
import { ProducerService } from "../amqp/producer.service";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { IMessageEvent, RootMsg, WORKFLOW_STATUS } from "./workflow-type";
import { AbstractWorkflow } from "./workflow.service";

@Injectable()
export class WorkflowHelperService {
	protected readonly logger!: ContextLogger;
	public constructor(
		protected readonly loggerService: LoggerService,
		private readonly producerService: ProducerService,
		private readonly workflowSqlService: WorkflowCoreSQLService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	/**
	 * Trigger a workflow service to run its operations
	 * How it's run is up to the workflow service
	 */
	public async runWorkflow<T extends AbstractWorkflow>(params: {
		wfEntity: WorkflowEntity;
		wfDEF: T;
	}): Promise<void> {
		const { wfEntity, wfDEF } = params;

		this.logger.log(
			{
				traceId: wfEntity.correlationId,
			},
			`Distributor request execute ${wfEntity.workflowName}`,
		);

		const message: IMessageEvent<RootMsg> = {
			parsedMessage: new RootMsg(params.wfEntity.id, params.wfEntity.correlationId),
		};

		await this.producerService.sendMessage({
			traceId: wfEntity.correlationId,
			address: wfDEF.address,
			message: JSON.stringify(message),
			messageId: v4(),
			durable: true,
		});
	}

	public async syncRequest<K extends AbstractWorkflow>(params: {
		correlationId: string;
		workflow: K;
		maxAttempt: number;
	}) {
		const { correlationId, workflow, maxAttempt } = params;
		const wfEntity = await this.saveWorkflowItem({
			correlationId,
			workflowName: workflow.name,
			maxAttempt,
		});
		if (!wfEntity) {
			this.logger.error(
				{ traceId: correlationId },
				`Can not save workflow item`,
				new Error("Failed to register workflow item"),
			);
		}

		const status = await this.optimisticTrigger({
			wfEntity: wfEntity as WorkflowEntity,
			workflow,
		});

		return status;
	}

	public async optimisticTrigger<K extends AbstractWorkflow>(params: { wfEntity: WorkflowEntity; workflow: K }) {
		const { wfEntity, workflow } = params;
		if (wfEntity.status !== WORKFLOW_STATUS.NEW) {
			const errorMessage = `Workflow ${wfEntity.workflowName} is not in NEW status`;
			const error = new InternalServerErrorException(errorMessage);
			this.logger.error({ traceId: wfEntity.correlationId }, errorMessage, error);
			throw error;
		}

		await this.runWorkflow({
			wfEntity,
			wfDEF: workflow,
		});

		return WORKFLOW_STATUS.PROCESSING;
	}

	public async saveWorkflowItem(params: { correlationId: string; workflowName: string; maxAttempt: number }) {
		const { correlationId, workflowName, maxAttempt } = params;
		return this.workflowSqlService.sqlNewWorkflowItem(undefined, {
			correlationId,
			workflowName,
			maxAttempt,
		});
	}

	/**
	 * Mark workflow items as need to be re-run (after Completed/Failed)
	 */
	public async resetWorkflowItems(params: { correlationIds: string[]; workflowName: string }) {
		return this.workflowSqlService.sqlMarkAsPendingReset(undefined, params);
	}
}
