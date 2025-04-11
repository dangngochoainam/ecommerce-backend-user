import { Body, Controller, Post } from "@nestjs/common";
import { NON_ENCRYPTION } from "src/core/crypto/crypto.decorator";
import { WorkflowHelperService } from "src/core/workflow/workflow-helper.service";
import { CronjobWf } from "src/shared-workflow/cronjob/cronjob.workflow";

@Controller()
export class TriggerConjobController {
	public constructor(private readonly workflowHelperService: WorkflowHelperService) {}

	@NON_ENCRYPTION
	@Post("workflow/trigger-cronjob")
	public async triggerCronjob(@Body() body: { correlationId: string }) {
		return await this.workflowHelperService.syncRequest<typeof CronjobWf>({
			maxAttempt: 5,
			workflow: CronjobWf,
			correlationId: body.correlationId,
		});
	}
}
