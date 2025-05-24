import { WorkflowEntity } from "src/db-workflow/entity/workflow.entity";
import { AbstractWorkflowService } from "./workflow.service";
import { RERUN, WORKFLOW_OPERATIONS } from "./workflow-type";

export class Executor<T extends AbstractWorkflowService<any>> {
	public constructor(
		public readonly workflowService: T,
		public readonly wfEntity: WorkflowEntity,
	) {}

	public async assert<OPS extends WORKFLOW_OPERATIONS<T>, Step extends keyof WORKFLOW_OPERATIONS<T>>(
		step: Step,
		...args: OPS[Step] extends (...args: infer Args) => any ? Args : never
	): Promise<typeof RERUN | undefined> {
		return this.workflowService["_assert"][step](...args);
	}

	public async execute<OPS extends WORKFLOW_OPERATIONS<T>, Step extends keyof WORKFLOW_OPERATIONS<T>>(
		step: Step,
		...args: OPS[Step] extends (...args: infer Args) => any ? Args : never
	) {
		if (this.wfEntity.currentAttempt != 0) {
			const res = await this.assert(step, ...args);
			if (res !== RERUN) return res;
		}

		const ops = this.workflowService["_operations"][step];
		return ops(...args);
	}
}
