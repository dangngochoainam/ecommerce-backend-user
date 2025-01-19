import { DynamicModule, Global, Module } from "@nestjs/common";
import { LoggerService } from "./logger.service";
import { BaseSqlLoggerService } from "./sql-logger.service";

export const SQL_LOGGER_PROVIDER = Symbol("SQL_LOGGER_PROVIDER");

@Global()
@Module({})
export class LoggerModule {
	public static factory(name: string): DynamicModule {
		return {
			module: LoggerModule,
			providers: [
				{
					provide: LoggerService,
					useFactory: (sqlService: BaseSqlLoggerService) => {
						return LoggerService.getInstance(sqlService, name);
					},
					inject: [SQL_LOGGER_PROVIDER],
				},
			],
			exports: [LoggerService],
			global: true,
		};
	}
}
