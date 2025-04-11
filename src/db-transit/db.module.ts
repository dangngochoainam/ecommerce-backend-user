import { DynamicModule, Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { CoreEnvironment, CoreEnvironmentService } from "src/core/environment/environment.service";
import { DBLogger } from "src/core/logger/db-logger";
import { SQL_LOGGER_PROVIDER } from "src/core/logger/logger.module";
import { SqlLoggerService } from "src/db-log/module/sql-logger/sql-logger.service";
import { TransitEnvironmentClass } from "./environment";
import { typeormOptions as transitTypeorm } from "./typeorm.module";

type IDBTransitEnvironment = InstanceType<ReturnType<typeof TransitEnvironmentClass<ConstructorFunction<unknown>>>>;

@Module({})
export class DatabaseTransitModule {
	public static forRoot<T extends CoreEnvironment & IDBTransitEnvironment>(options?: {
		/** @default "EXAMPLE" */
		name?: string;
		typeOrmOptions?: Partial<TypeOrmModuleOptions>;
	}): DynamicModule {
		const LOG_PREFIX = options?.name || "EXAMPLE";
		const module = TypeOrmModule.forRootAsync({
			inject: [CoreEnvironmentService, SQL_LOGGER_PROVIDER],
			name: transitTypeorm.name,
			useFactory: (env: CoreEnvironmentService<T>, sqlLoggerService: SqlLoggerService) =>
				({
					host: env.ENVIRONMENT.DB_TRANSIT_HOST,
					port: env.ENVIRONMENT.DB_TRANSIT_PORT,
					schema: env.ENVIRONMENT.DB_TRANSIT_SCHEMA,
					database: env.ENVIRONMENT.DB_TRANSIT_DATABASE,
					username: env.ENVIRONMENT.DB_TRANSIT_USERNAME,
					password: env.ENVIRONMENT.DB_TRANSIT_PASSWORD,
					...transitTypeorm,
					logger: new DBLogger(sqlLoggerService, `${LOG_PREFIX}__TRANSIT_DB`, transitTypeorm.name || ""),

					...options?.typeOrmOptions,
					synchronize: false,
				}) as TypeOrmModuleOptions,
		});

		return {
			global: true,
			module: DatabaseTransitModule,
			imports: [module],
			exports: [module],
		};
	}
}
