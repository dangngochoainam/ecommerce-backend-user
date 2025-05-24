import { AbstractWorkflow } from "src/core/workflow/workflow-type";

export enum CRONJOB_WORKFLOW_STEP {
	START = "START",
	END = "END",
}

class _CronjobWf extends AbstractWorkflow<CRONJOB_WORKFLOW_STEP> {
	public name: string = "CronjobService";
	public address: string = `Q-${this.name}`;
	public exchange: string = `E-${this.name}`;
	public constructor() {
		super();
	}
}

export const CronjobWf = new _CronjobWf();
