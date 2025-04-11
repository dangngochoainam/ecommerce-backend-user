import { Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { CronSchedule, Schedule } from "src/core/workflow/schedule";
import { CONTINUE, RUN_RESULT } from "src/core/workflow/workflow-type";
import { AbstractWorkflowService } from "src/core/workflow/workflow.service";
import { CronjobWf } from "src/shared-workflow/cronjob/cronjob.workflow";
@Injectable()
export class CronjobService extends AbstractWorkflowService<typeof CronjobWf> {
	protected readonly logger!: ContextLogger;
	public constructor(protected readonly loggerService: LoggerService) {
		super(loggerService);
	}
	public name: string = "CronjobService";
	public schedule: Schedule = new CronSchedule("45 * * * * *", 1);
	public onFinished: undefined;

	public DEF: typeof CronjobWf = CronjobWf;

	// TODO: Business logic of wf
	protected async run(): Promise<RUN_RESULT> {
		return CONTINUE;
	}
}
