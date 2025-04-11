import { AbstractWorkflow } from "src/core/workflow/workflow.service";

class _CronjobWf extends AbstractWorkflow {
	public name: string = "CronjobService";
	public address: string = `Q-${this.name}`;
	public exchange: string = `E-${this.name}`;
	public constructor() {
		super();
	}
}

export const CronjobWf = new _CronjobWf();
