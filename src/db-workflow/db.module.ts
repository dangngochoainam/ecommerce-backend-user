import { DynamicModule, Global, Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { CoreEnvironment, CoreEnvironmentService } from "src/core/environment/environment.service";
import { DBLogger } from "src/core/logger/db-logger";
import { SQL_LOGGER_PROVIDER } from "src/core/logger/logger.module";
import { SqlLoggerService } from "src/db-log/module/sql-logger/sql-logger.service";
import { WorkflowDBEnvironmentClass } from "./environment";
import { typeormOptions as wfTypeorm } from "./typeorm.module";

type IDBWorkflowEnvironment = InstanceType<ReturnType<typeof WorkflowDBEnvironmentClass<ConstructorFunction<unknown>>>>;

@Global()
@Module({})
export class DatabaseWorkflowModule {
	public static forRoot<T extends CoreEnvironment & IDBWorkflowEnvironment>(options?: {
		name?: string;
		typeOrmOptions?: Partial<TypeOrmModuleOptions>;
	}): DynamicModule {
		const LOG_PREFIX = options?.name || "EXAMPLE";
		const module = TypeOrmModule.forRootAsync({
			inject: [CoreEnvironmentService, SQL_LOGGER_PROVIDER],
			name: wfTypeorm.name,
			useFactory: (env: CoreEnvironmentService<T>, sqlLoggerService: SqlLoggerService) =>
				({
					host: env.ENVIRONMENT.DB_WORKFLOW_HOST,
					port: env.ENVIRONMENT.DB_WORKFLOW_PORT,
					schema: env.ENVIRONMENT.DB_WORKFLOW_SCHEMA,
					database: env.ENVIRONMENT.DB_WORKFLOW_DATABASE,
					username: env.ENVIRONMENT.DB_WORKFLOW_USERNAME,
					password: env.ENVIRONMENT.DB_WORKFLOW_PASSWORD,
					...wfTypeorm,
					logger: new DBLogger(sqlLoggerService, `${LOG_PREFIX}__WORKFLOW_DB`, wfTypeorm.name || ""),

					...options?.typeOrmOptions,
					synchronize: false,
				}) as TypeOrmModuleOptions,
		});

		return {
			global: true,
			module: DatabaseWorkflowModule,
			imports: [module],
			exports: [module],
		};
	}
}
