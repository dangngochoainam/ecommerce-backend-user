export abstract class AbstractWorkflowEntity {
	private constructor() {}

	/**
	 * aka correlation id
	 */
	public abstract id: string;

	public abstract correlationId: string;

	public abstract serviceName: string;

	public abstract workflowName: string;

	public abstract finished?: boolean;

	public abstract pendingReset: boolean;
}
