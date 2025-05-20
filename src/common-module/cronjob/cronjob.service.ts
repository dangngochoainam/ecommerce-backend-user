import { Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { CronSchedule, Schedule } from "src/core/workflow/schedule";
import { RUN_RESULT } from "src/core/workflow/workflow-type";
import { AbstractWorkflowService } from "src/core/workflow/workflow.service";
import { WorkflowEntity } from "src/db-workflow/entity/workflow.entity";
import { CronjobWf } from "src/shared-workflow/cronjob/cronjob.workflow";
@Injectable()
export class CronjobService extends AbstractWorkflowService<typeof CronjobWf> {
	protected readonly logger!: ContextLogger;
	public constructor(protected readonly loggerService: LoggerService) {
		super(loggerService);
	}
	public name: string = "CronjobService";
	public schedule: Schedule = new CronSchedule("45 * * * * *", 1);

	public DEF: typeof CronjobWf = CronjobWf;

	// TODO: Business logic of wf
	protected async run(): Promise<RUN_RESULT> {
		return;
	}

	protected onFinished = async (wfEntity: WorkflowEntity) => {
		this.logger.log({ traceId: wfEntity.correlationId }, "Cronjob finished");
		this.logger.log({ traceId: wfEntity.correlationId }, JSON.stringify(wfEntity));
	};
}
