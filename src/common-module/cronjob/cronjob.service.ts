import { Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { CronSchedule, Schedule } from "src/core/workflow/schedule";
import { Executor } from "src/core/workflow/workflow-common";
import { RERUN, RUN_RESULT } from "src/core/workflow/workflow-type";
import { AbstractWorkflowService } from "src/core/workflow/workflow.service";
import { WorkflowEntity } from "src/db-workflow/entity/workflow.entity";
import { CRONJOB_WORKFLOW_STEP, CronjobWf } from "src/shared-workflow/cronjob/cronjob.workflow";
@Injectable()
export class CronjobService extends AbstractWorkflowService<typeof CronjobWf> {
	public readonly logger!: ContextLogger;
	public constructor(protected readonly loggerService: LoggerService) {
		super(loggerService);
	}
	public name: string = "CronjobService";
	public schedule: Schedule = new CronSchedule("45 * * * * *", 1);

	public DEF: typeof CronjobWf = CronjobWf;

	public _assert = {
		[CRONJOB_WORKFLOW_STEP.START]: async (correlationId: string) => {
			this.logger.log({ traceId: correlationId }, "Assert ABC");
			return RERUN;
		},
		[CRONJOB_WORKFLOW_STEP.END]: async (correlationId: string) => {
			this.logger.log({ traceId: correlationId }, "Assert ABC");
			return;
		},
	};

	public _operations = {
		[CRONJOB_WORKFLOW_STEP.START]: async (correlationId: string) => {
			this.logger.log({ traceId: correlationId }, "Assert ABC");
			return "asd";
		},
		[CRONJOB_WORKFLOW_STEP.END]: async (correlationId: string) => {
			this.logger.log({ traceId: correlationId }, "Assert ABC");
			return "dfs";
		},
	};

	protected async run(executor: Executor<CronjobService>): Promise<RUN_RESULT> {
		const endResult = await executor.execute(CRONJOB_WORKFLOW_STEP.END, "123");
		this.logger.debug({ traceId: executor.wfEntity.correlationId }, `End result: ${endResult}`);
		return;
	}

	protected onFinished = async (wfEntity: WorkflowEntity) => {
		this.logger.log({ traceId: wfEntity.correlationId }, "Cronjob finished");
		this.logger.log({ traceId: wfEntity.correlationId }, JSON.stringify(wfEntity));
	};
}
