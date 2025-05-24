import { AbstractWorkflowService } from "./workflow.service";

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

export type WORKFLOW_OPERATIONS<T extends AbstractWorkflowService<any>> = T["_operations"];

export type Operation<T extends string> = {
	[key in T]: (...args: any) => Promise<any>;
};

export type Assertion<T extends AbstractWorkflowService<any>> = {
	[K in keyof WORKFLOW_OPERATIONS<T>]: (
		...args: WORKFLOW_OPERATIONS<T>[K] extends (...args: infer Args) => any ? Args : never
		// TODO: not understand this type
	) => Promise<Awaited<ReturnType<WORKFLOW_OPERATIONS<T>[K]>> | typeof RERUN>;
};

export interface DEF {
	address: string;
	exchange: string;
}

export interface IMessageEvent<T> {
	parsedMessage: T;
	msg?: any;
	senderId?: string;
	replyTo?: { address: string };
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

export abstract class AbstractWorkflow<WORKFLOW_STEP extends string> {
	public abstract address: string;
	public abstract exchange: string;
	public abstract name: string;
	public step!: WORKFLOW_STEP;
}
