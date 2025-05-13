import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { AbstractWorkflowService } from "../workflow.service";
import { CronSchedule, IntervalSchedule } from "../schedule";
import { CronJob } from "cron";
import { WorkflowCoreSQLService } from "src/db-workflow/module/workflow-core/workflow-core.service";
import { WorkflowEntity } from "src/db-workflow/entity/workflow.entity";
import { WorkflowHelperService } from "../workflow-helper.service";

export const DISTRIBUTOR_TOKEN = Symbol("DISTRIBUTOR_TOKEN");

/**
 * Scan pending WF and request WFService to process - finalize WF statuses
 * This is an eventual process, which mean for each WF, this finalizes
 * process can run multiple times
 */
@Injectable()
export class DistributorService<T extends AbstractWorkflowService<any>> implements OnModuleInit, OnModuleDestroy {
	protected logger!: ContextLogger;
	private cron?: CronJob;
	private resetInterval!: IntervalTask;

	public constructor(
		protected readonly loggerService: LoggerService,
		@Inject(DISTRIBUTOR_TOKEN) private readonly workflowService: T,
		protected readonly workflowSQLService: WorkflowCoreSQLService,
		protected readonly wfHelperService: WorkflowHelperService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	private get scheduleConfig() {
		return this.workflowService.schedule;
	}

	public async onModuleDestroy() {
		if (this.cron) {
			this.cron.stop();
		}
		this.resetInterval.stop();
	}

	private handleResetWorkflow() {
		if (this.resetInterval) {
			this.resetInterval.stop();
		}
		this.resetInterval = new IntervalTask(60, async () => {
			this.logger.log(
				{
					traceId: this.workflowService.constructor.name,
				},
				"Checking pending reset workflow...",
			);
			await this.workflowSQLService.sqlResetCompletedWorkflow(undefined, {
				workflowName: this.workflowService.DEF.name,
			});
		}).start();
	}

	public async onModuleInit(): Promise<void> {
		this.handleResetWorkflow();
		if (this.scheduleConfig instanceof IntervalSchedule) {
		} else if (this.scheduleConfig instanceof CronSchedule) {
			if (!this.cron) {
				this.cron = new CronJob(this.scheduleConfig.cronPattern, this.distributeWfItems);
				this.cron.start();
			} else {
				this.cron.start();
			}
		}
	}

	protected distributeWfItems = async () => {
		const wfList = await this.workflowSQLService.sqlGetPendingWorkflowItem(undefined, {
			workflowName: this.workflowService.DEF.name,
		});

		this.logger.log(
			{
				traceId: this.workflowService.DEF.name,
			},
			`Distributing ${wfList.length} workflow item(s)...`,
		);
		for (const wf of wfList) {
			await this.requestDistribute(wf);
		}
	};

	protected requestDistribute = async (wf: WorkflowEntity) => {
		return this.wfHelperService.runWorkflow({
			wfEntity: wf,
			wfDEF: this.workflowService.DEF,
		});
	};
}

class IntervalTask {
	private interval?: NodeJS.Timeout;
	public constructor(
		protected readonly intervalInSeconds: number,
		protected readonly cb: () => void,
	) {}

	public stop() {
		if (!this.interval) return;
		clearInterval(this.interval);
		this.interval = undefined;
	}

	public start() {
		if (this.interval) {
			this.stop();
		}
		this.interval = setInterval(this.cb, this.intervalInSeconds * 1000);
		return this;
	}
}
