import { Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { CronSchedule, Schedule } from "src/core/workflow/schedule";
import { DEF, RUN_RESULT } from "src/core/workflow/workflow-type";
import { AbstractWorkflowService } from "src/core/workflow/workflow.service";
@Injectable()
export class CronjobService extends AbstractWorkflowService {
	protected readonly logger!: ContextLogger;
	public constructor(protected readonly loggerService: LoggerService) {
		super(loggerService);
	}
	public name: string = "CronjobService";
	public schedule: Schedule = new CronSchedule("45 * * * * *", 1);

	public DEF: DEF = { address: `Q-${this.name}`, exchange: `E-${this.name}` };

	// TODO: Business logic of wf
	protected async run(): Promise<RUN_RESULT> {
		return;
	}
}
