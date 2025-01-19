import { DynamicModule, FactoryProvider, Global, Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { SQL_LOG_DB_CONNECTION_NAME, SqlQueryLogger } from "./module/sql-logger/db-logger";
import { join } from "path";
import { LogEntity } from "./entity/log.entity";
import { EntityClassOrSchema } from "@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type";
import { SQL_LOGGER_PROVIDER } from "src/core/logger/logger.module";
import { SqlLoggerService } from "./module/sql-logger/sql-logger.service";

export const OPTIONS_PROVIDER = Symbol("OPTIONS_PROVIDER");

@Global()
@Module({})
export class LogDbModule {
	public static create(
		optsProvider: Omit<FactoryProvider<TypeOrmModuleOptions>, "provide">,
		customLogEntities: EntityClassOrSchema[] = [],
	): DynamicModule {
		return {
			module: LogDbModule,
			providers: [
				{
					...optsProvider,
					provide: OPTIONS_PROVIDER,
				},
				{
					provide: SQL_LOGGER_PROVIDER,
					useClass: SqlLoggerService,
				},
			],
			imports: [
				TypeOrmModule.forRootAsync({
					name: SQL_LOG_DB_CONNECTION_NAME,
					useFactory: (ormOptions: TypeOrmModuleOptions) => {
						return {
							...ormOptions,
							type: "postgres",
							logger: new SqlQueryLogger(
								`${SQL_LOG_DB_CONNECTION_NAME}_LOG_DB`,
								SQL_LOG_DB_CONNECTION_NAME,
							),
							logging: true,
							synchronize: false,
							entities: [join(__dirname, "/entity/**.entity{.ts,.js}")],
							extra: {
								connectionLimit: 10,
							},
							keepConnectionAlive: true,
							name: SQL_LOG_DB_CONNECTION_NAME,
						} as TypeOrmModuleOptions;
					},
					inject: [OPTIONS_PROVIDER],
				}),
				TypeOrmModule.forFeature([LogEntity, ...customLogEntities], SQL_LOG_DB_CONNECTION_NAME),
			],
			exports: [
				{
					...optsProvider,
					provide: OPTIONS_PROVIDER,
				},
				{
					provide: SQL_LOGGER_PROVIDER,
					useClass: SqlLoggerService,
				},
			],
		};
	}
}
