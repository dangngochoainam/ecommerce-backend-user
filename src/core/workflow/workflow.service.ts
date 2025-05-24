import { DynamicModule, Global, Inject, Injectable, Module, ModuleMetadata, OnModuleInit, Type } from "@nestjs/common";
import { MutexModule } from "src/common-module/redis-mutex/mutex.module";
import { MutexService } from "src/common-module/redis-mutex/mutex.service";
import { WorkflowEntity } from "src/db-workflow/entity/workflow.entity";
import { WorkflowCoreSQLService } from "src/db-workflow/module/workflow-core/workflow-core.service";
import { ConsumerService } from "../amqp/consumer.service";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { DISTRIBUTOR_TOKEN, DistributorService } from "./distributor/distributor.service";
import { Schedule } from "./schedule";
import { WorkflowHelperService } from "./workflow-helper.service";
import {
	AbstractWorkflow,
	Assertion,
	CONTINUE,
	FAIL,
	FINAL_WORKFLOW_STATUS,
	IMessageEvent,
	Operation,
	RootMsg,
	RUN_RESULT,
	SKIP,
	WORKFLOW_STATUS,
} from "./workflow-type";
import { AbstratMessaging } from "./messaging";
import { ProducerService } from "../amqp/producer.service";
import { v4 } from "uuid";
import { Executor } from "./workflow-common";

@Injectable()
export abstract class AbstractWorkflowService<DEF extends AbstractWorkflow<string>>
	extends AbstratMessaging<DEF>
	implements OnModuleInit
{
	public readonly logger!: ContextLogger;

	public abstract readonly schedule: Schedule;

	public abstract readonly DEF: DEF;

	protected abstract onFinished?: (wfEntity: WorkflowEntity) => Promise<void>;

	public constructor(protected readonly loggerService: LoggerService) {
		super();
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	@Inject()
	protected readonly workflowHelperService!: WorkflowHelperService;

	@Inject()
	private readonly workflowSqlService!: WorkflowCoreSQLService;

	@Inject()
	protected readonly consumerService!: ConsumerService;

	@Inject()
	protected readonly producerService!: ProducerService;

	@Inject()
	private readonly mutexService!: MutexService;

	public abstract _assert: Assertion<AbstractWorkflowService<DEF>>;

	public abstract _operations: Operation<DEF["step"]>;

	public async onModuleInit(): Promise<void> {
		await this.listen();
	}

	protected async onMessage(msg: IMessageEvent<RootMsg>) {
		const wf = await this.execute(msg);

		if (wf && msg.replyTo) {
			const message: IMessageEvent<any> = {
				parsedMessage: wf,
				receiverId: msg.senderId,
				correlationId: msg.correlationId,
			};
			await this.producerService.sendMessage({
				messageId: v4(),
				address: msg.replyTo?.address as string,
				durable: true,
				traceId: msg.correlationId as string,
				message: JSON.stringify(message),
				receiverId: msg.senderId,
			});
		}
	}

	private async execute(msgEvent: IMessageEvent<RootMsg>): Promise<WorkflowEntity | undefined> {
		const { workflowId, correlationId } = msgEvent.parsedMessage;
		let wfEntity = await this.workflowSqlService.sqlGetWorkflowByID(undefined, { workflowId });
		if (!wfEntity) {
			this.logger.error(
				{
					traceId: correlationId,
				},
				`Can not find in progress workflow id ${workflowId}. Ignored`,
				new Error(),
			);
			return;
		}

		if (wfEntity.finished || FINAL_WORKFLOW_STATUS.includes(wfEntity.status as WORKFLOW_STATUS)) {
			return wfEntity;
		}

		const executeLock = await this.mutexService.getTimeoutLock(wfEntity.id, 10000);

		if (wfEntity.status === WORKFLOW_STATUS.NEW) {
			await this.workflowSqlService.sqlUpdateWfStatus(undefined, {
				workflowId: wfEntity.id,
				status: WORKFLOW_STATUS.PROCESSING,
			});
		}
		try {
			let runStatus = undefined;
			let isSkipThisRun: boolean = false;
			const startTime = new Date();
			const executor = new Executor(this, wfEntity);
			try {
				const runResult = await this.run(executor);
				const duration = (new Date().getTime() - startTime.getTime()) / 1000;
				this.logger.debug(
					{
						traceId: wfEntity.correlationId,
					},
					`${this.DEF.name} execute run function take ${duration} s`,
				);
				if (runResult === FAIL) {
					await this.workflowSqlService.sqlUpdateWfStatus(undefined, {
						status: WORKFLOW_STATUS.FAILED,
						workflowId: wfEntity.id,
					});
					wfEntity.status = WORKFLOW_STATUS.FAILED;
					return wfEntity;
				} else if (runResult === SKIP) {
					isSkipThisRun = true;
				} else if (runResult === CONTINUE) {
					this.logger.log(
						{
							traceId: wfEntity.correlationId,
						},
						`${this.DEF.name} run workflow item ${wfEntity.correlationId} have result CONTINUE`,
					);
				} else {
					runStatus = WORKFLOW_STATUS.COMPLETED;
				}
			} catch (error) {
				this.logger.error(
					{
						traceId: wfEntity.correlationId,
					},
					`Failed to run workflow item __ Stack: ${(error as Error)?.stack}`,
					error as Error,
				);
				// TODO: save wf error
			} finally {
				if (!isSkipThisRun) {
					await this.workflowSqlService.sqlIncreaseAttempt(undefined, {
						workflowId: wfEntity.id,
					});
				}
			}

			wfEntity = await this.workflowSqlService.sqlGetWorkflowByID(undefined, {
				workflowId: wfEntity.id,
			});
			if (!wfEntity) {
				throw new Error("FATAL: Can not get workflow item");
			}

			const resultAfterFullAttempt =
				runStatus === WORKFLOW_STATUS.COMPLETED ? WORKFLOW_STATUS.COMPLETED : WORKFLOW_STATUS.FAILED;
			const status = isSkipThisRun
				? WORKFLOW_STATUS.PROCESSING
				: wfEntity.currentAttempt === wfEntity.maxAttempt
					? resultAfterFullAttempt
					: runStatus;
			const duration = (new Date().getTime() - startTime.getTime()) / 1000;
			this.logger.warn(
				{
					traceId: wfEntity.correlationId,
				},
				`${wfEntity.correlationId} Done run at attempt ${wfEntity.currentAttempt} with status ${status} after ${duration} s`,
			);

			await this.workflowSqlService.sqlUpdateWfStatus(undefined, {
				workflowId: wfEntity.id,
				status,
			});

			status && (wfEntity.status = status);
			// Execute finish hook if exist
			if (FINAL_WORKFLOW_STATUS.includes(status as WORKFLOW_STATUS)) {
				await (this.onFinished && this.onFinished(wfEntity));
			}
			return wfEntity;
		} catch (error) {
			this.logger.error(
				{
					traceId: correlationId,
				},
				`Failed to run workflow item __ Stack: ${(error as Error)?.stack}`,
				error as Error,
			);
		} finally {
			await executeLock.release();
		}

		return wfEntity as WorkflowEntity;
	}

	protected abstract run(executor: Executor<any>): Promise<RUN_RESULT>;

	public static createModule<T extends AbstractWorkflowService<any>>(
		service: Type<T>,
		metadata?: ModuleMetadata,
	): DynamicModule {
		@Global()
		@Module({})
		class M {}
		return {
			global: true,
			module: M,
			imports: [MutexModule, ...(metadata?.imports || [])],
			providers: [
				service,
				{
					provide: DISTRIBUTOR_TOKEN,
					useExisting: service,
				},
				DistributorService,
				...(metadata?.providers || []),
			],
			exports: [service],
		};
	}
}
