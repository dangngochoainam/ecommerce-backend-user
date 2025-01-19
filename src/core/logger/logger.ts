import * as Pino from "pino";
import { inspect } from "util";
import { LoggerService } from "@nestjs/common";
import { ICustomLogging } from "./logger.service";
import { BaseSqlLoggerService } from "./sql-logger.service";
import { CoreEnvironmentProvider } from "../environment/environment.service";

export const pino = Pino.pino({
	level: "trace",
	transport: {
		target: "pino-pretty",
	},
});

export class CommonLogger implements LoggerService {
	constructor(protected context: string) {}

	public log(message: unknown, customLogging?: ICustomLogging): void {
		pino.trace(
			{
				traceId: customLogging?.traceId,
				context: customLogging?.context,
				parentContext: this.context,
			},
			`${typeof message === "object" ? inspect(message) : message}`,
		);
	}

	public info(message: unknown, context: string = ""): void {
		pino.info(this.context + `[${context}]` + `${typeof message === "object" ? inspect(message) : message}`);
	}

	public error(message: unknown, trace?: string | undefined, context: string = ""): void {
		pino.error(
			this.context +
				`[${context}]` +
				`${typeof message === "object" ? inspect(message) : message}` +
				"---" +
				trace,
		);
	}

	public warn(message: unknown, context: string = ""): void {
		pino.warn(this.context + `[${context}]` + `${typeof message === "object" ? inspect(message) : message}`);
	}

	public debug(message: unknown, context: string = ""): void {
		if (CoreEnvironmentProvider.useValue.ENVIRONMENT.LOG_DEBUG_MODE) {
			pino.debug(this.context + `[${context}]` + `${typeof message === "object" ? inspect(message) : message}`);
		}
	}
}

export class SqlLogger extends CommonLogger {
	constructor(
		protected context: string,
		protected sqlLoggerService?: BaseSqlLoggerService,
	) {
		super(context);
	}

	public debug(message: unknown, context: string = ""): void {
		if (CoreEnvironmentProvider.useValue.ENVIRONMENT.LOG_DEBUG_MODE) {
			super.debug(message, context);
		}
		if (this.sqlLoggerService) {
			const sqlLog = this.sqlLoggerService.debug(
				{ context, name: this.context },
				`${typeof message === "object" ? inspect(message) : message}`,
			);
			pino.debug(
				{
					context,
					parentContext: this.context,
				},
				`[[[Debug content storing in db with id: ${sqlLog.id}]]]`,
			);
		}
	}
}
