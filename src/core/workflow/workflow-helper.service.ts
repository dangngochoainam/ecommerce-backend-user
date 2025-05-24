import { Injectable, InternalServerErrorException, OnModuleInit } from "@nestjs/common";
import { WorkflowEntity } from "src/db-workflow/entity/workflow.entity";
import { WorkflowCoreSQLService } from "src/db-workflow/module/workflow-core/workflow-core.service";
import { ProducerService } from "../amqp/producer.service";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { ConsumerService } from "./../amqp/consumer.service";
import { AbstratMessaging } from "./messaging";
import { AbstractWorkflow, IMessageEvent, RootMsg, WORKFLOW_STATUS } from "./workflow-type";
import { delay, filter, firstValueFrom, of, race, take } from "rxjs";
import { v4 } from "uuid";

class _WorkflowHelperWf extends AbstractWorkflow<string> {
	public name: string = "WorkflowHelperService";
	public address: string = `Q-${this.name}`;
	public exchange: string = `E-${this.name}`;
	public constructor() {
		super();
	}
}

export const WorkflowHelperWf = new _WorkflowHelperWf();

@Injectable()
export class WorkflowHelperService extends AbstratMessaging<typeof WorkflowHelperWf> implements OnModuleInit {
	protected readonly logger!: ContextLogger;
	public constructor(
		protected readonly loggerService: LoggerService,
		protected readonly producerService: ProducerService,
		protected readonly consumerService: ConsumerService,
		private readonly workflowSqlService: WorkflowCoreSQLService,
	) {
		super();
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public DEF: typeof WorkflowHelperWf = WorkflowHelperWf;

	protected async onMessage(_: IMessageEvent<RootMsg>): Promise<void> {}

	public async onModuleInit() {
		await this.listen();
	}

	/**
	 * Trigger a workflow service to run its operations
	 * How it's run is up to the workflow service
	 */
	public async runWorkflow<T extends AbstractWorkflow<string>>(params: {
		wfEntity: WorkflowEntity;
		wfDEF: T;
		replyTo?: { address: string; id: string };
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
			senderId: params.replyTo?.id,
			replyTo: params.replyTo,
		};

		await this.enqueue(message, { traceId: wfEntity.correlationId, address: wfDEF.address });
	}

	public async syncRequest<K extends AbstractWorkflow<string>>(params: {
		correlationId: string;
		workflow: K;
		maxAttempt: number;
		timeoutSeconds?: number;
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
			timeoutSeconds: params.timeoutSeconds || 0,
		});

		return status || WORKFLOW_STATUS.PROCESSING;
	}

	public async optimisticTrigger<K extends AbstractWorkflow<string>>(params: {
		wfEntity: WorkflowEntity;
		workflow: K;
		timeoutSeconds: number;
	}) {
		const { wfEntity, workflow, timeoutSeconds } = params;
		const senderId = v4();
		if (wfEntity.status !== WORKFLOW_STATUS.NEW) {
			const errorMessage = `Workflow ${wfEntity.workflowName} is not in NEW status`;
			const error = new InternalServerErrorException(errorMessage);
			this.logger.error({ traceId: wfEntity.correlationId }, errorMessage, error);
			throw error;
		}

		const res = this.source
			? firstValueFrom(
					race(
						this.source.pipe(
							filter((msgEvent) => {
								if (msgEvent.receiverId) {
									this.logger.log(
										{
											traceId: wfEntity.correlationId,
										},
										`Sender ${msgEvent.receiverId} got replied message`,
									);
									return msgEvent.receiverId === senderId;
								}
								return false;
							}),
							take(1),
						),
						of(undefined).pipe(delay(timeoutSeconds * 1000)),
					),
				)
			: undefined;

		await this.runWorkflow({
			wfEntity,
			wfDEF: workflow,
			replyTo: { address: this.DEF.address, id: senderId },
		});

		const msg = res ? await res : undefined;

		this.logger.debug({}, msg?.parsedMessage.status);

		return msg?.parsedMessage.status || WORKFLOW_STATUS.PROCESSING;
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
