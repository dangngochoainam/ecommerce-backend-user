export enum SQL_LOGGER_TYPE {
	DEBUG = "DEBUG",
	INFO = "INFO",
	WARN = "WARN",
	ERROR = "ERROR",
}

export interface ISqlLoggerPayload {
	id: string;
	instanceId: string;
	name?: string;
	context?: string;
	type: SQL_LOGGER_TYPE;
	traceId?: string;
	message: string;
}
