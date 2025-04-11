export enum WORKFLOW_STATUS {
	NEW = "NEW",
	PROCESSING = "PROCESSING",
	COMPLETED = "COMPLETED",
	FAILED = "FAILED",
}

export const FINAL_WORKFLOW_STATUS = [WORKFLOW_STATUS.COMPLETED, WORKFLOW_STATUS.FAILED];

/**
 * Instruct the workflow to pause (sleep) till next wake attempt
 */
export const PAUSE = Symbol("PAUSE");
/**
 * Instruct the workflow to fail instantly
 */
export const FAIL = Symbol("FAIL");
/**
 * Instruct the workflow to continue next time.
 * Do not execute finalize and not increase attempt
 */
export const CONTINUE = Symbol("CONTINUE");
/**
 * Instruct the workflow to continue next time.
 * Do not execute finalize and not increase attempt
 */
export const SKIP = Symbol("SKIP");
/**
 * Instruct to rerun the corresponding operation
 */
export const RERUN = Symbol("RERUN");

export type RUN_RESULT = typeof PAUSE | typeof FAIL | typeof CONTINUE | typeof SKIP | void;

export interface DEF {
	address: string;
	exchange: string;
}

export interface IMessageEvent<T> {
	parsedMessage: T;
	msg?: any;
	senderId?: string;
	receiverId?: string;
	correlationId?: string;
}

export class RootMsg {
	public correlationId: string;
	public workflowId: string;
	public constructor(workflowId: string, correlationId: string) {
		this.correlationId = correlationId;
		this.workflowId = workflowId;
	}
}
