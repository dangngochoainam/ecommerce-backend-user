import { Logger, QueryRunner } from "typeorm";
import { SqlLogger } from "./logger";
import { BaseSqlLoggerService } from "./sql-logger.service";
import { CoreEnvironmentProvider } from "../environment/environment.service";

export class DBLogger extends SqlLogger implements Logger {
	public constructor(
		public sqlLoggerService: BaseSqlLoggerService,
		public name: string,
		public connectionName: string,
	) {
		super(name, sqlLoggerService);
	}

	public logQuery(query: string, parameters?: unknown[] | undefined, _queryRunner?: QueryRunner | undefined): void {
		const message = `${query} _______ ${parameters}`;
		if (CoreEnvironmentProvider.useValue.ENVIRONMENT.LOG_DEBUG_MODE) {
			this.log(message, {
				context: this.connectionName,
			});
		}
		const sqlLog = this.sqlLoggerService.info({ name: this.name, context: this.connectionName }, message);
		this.log(`[[[Log content storing in db with id: ${sqlLog.id}]]]`, {
			context: this.connectionName,
		});
	}

	public logQueryError(
		error: string,
		query: string,
		parameters?: unknown[] | undefined,
		_queryRunner?: QueryRunner | undefined,
	): void {
		const message = `${error} ------ ${query} _______ ${parameters}`;
		if (CoreEnvironmentProvider.useValue.ENVIRONMENT.LOG_DEBUG_MODE) {
			this.error(message, undefined, this.connectionName);
		}
		const sqlLog = this.sqlLoggerService.error({ name: this.name, context: this.connectionName }, message);
		this.error(`[[[Log content storing in db with id: ${sqlLog.id}]]]`, undefined, this.connectionName);
	}

	public logQuerySlow(
		time: number,
		query: string,
		parameters?: unknown[] | undefined,
		_queryRunner?: QueryRunner | undefined,
	): void {
		const message = `SLOW ${time} ----- ${query} _______ ${parameters}`;
		if (CoreEnvironmentProvider.useValue.ENVIRONMENT.LOG_DEBUG_MODE) {
			this.warn(message, this.connectionName);
		}
		const sqlLog = this.sqlLoggerService.warn({ name: this.name, context: this.connectionName }, message);
		this.warn(`[[[Log content storing in db with id: ${sqlLog.id}]]]`, this.connectionName);
	}

	public logSchemaBuild(message: string, _queryRunner?: QueryRunner | undefined): void {
		this.log(`${message}`, {
			context: this.connectionName,
		});
	}

	public logMigration(message: string, _queryRunner?: QueryRunner | undefined): void {
		this.log(`${message}`, {
			context: this.connectionName,
		});
	}
}
