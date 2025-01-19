import { CommonLogger } from "src/core/logger/logger";
import { Logger, QueryRunner } from "typeorm";

export const SQL_LOG_DB_CONNECTION_NAME = "sql-log";

export class SqlQueryLogger extends CommonLogger implements Logger {
	public constructor(
		public name: string,
		public connectionName: string,
	) {
		super(name);
	}

	public logQuery(
		_query: string,
		_parameters?: unknown[] | undefined,
		_queryRunner?: QueryRunner | undefined,
	): void {
		// const message = `${_query} _______ ${_parameters}`;
		// this.log(message, {
		// 	context: this.connectionName,
		// });
	}

	public logQueryError(
		_error: string,
		_query: string,
		_parameters?: unknown[] | undefined,
		_queryRunner?: QueryRunner | undefined,
	): void {
		// const message = `${_error} ------ ${_query} _______ ${_parameters}`;
		// this.error(message, undefined, this.connectionName);
	}

	public logQuerySlow(
		_time: number,
		_query: string,
		_parameters?: unknown[] | undefined,
		_queryRunner?: QueryRunner | undefined,
	): void {
		// const message = `SLOW ${_time} ----- ${_query} _______ ${_parameters}`;
		// this.warn(message, this.connectionName);
	}

	public logSchemaBuild(
		message: string,
		_queryRunner?: QueryRunner | undefined,
	): void {
		this.log(`${message}`, {
			context: this.connectionName,
		});
	}

	public logMigration(
		message: string,
		_queryRunner?: QueryRunner | undefined,
	): void {
		this.log(`${message}`, {
			context: this.connectionName,
		});
	}
}
