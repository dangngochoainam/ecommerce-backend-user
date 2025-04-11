import { Exclude, Expose, Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { stringToBoolean } from "src/shared/utils/class-transformer";

export function WorkflowDBEnvironmentClass<K extends ConstructorFunction<any>>(TargetClass: K) {
	@Exclude()
	class WorkflowDBEnvironment extends TargetClass {
		@Expose()
		@IsString()
		public DB_WORKFLOW_HOST!: string;

		@Expose()
		@IsNumber()
		@Type(() => Number)
		public DB_WORKFLOW_PORT!: number;

		@Expose()
		@IsString()
		public DB_WORKFLOW_USERNAME!: string;

		@Expose()
		@IsString()
		// @Transform(({ value, obj }) => decryptEnvValueByAES(value, obj.PASSWORD_ENCRYPTION_KEY))
		public DB_WORKFLOW_PASSWORD!: string;

		@Expose()
		@IsString()
		public DB_WORKFLOW_DATABASE!: string;

		@Expose()
		@IsString()
		public DB_WORKFLOW_SCHEMA!: string;

		@Expose()
		@Transform(({ value }) => stringToBoolean(value))
		public DB_WORKFLOW_SSL_ENABLED!: boolean;

		@IsString()
		@Type(() => String)
		@Expose()
		@IsOptional()
		public DB_WORKFLOW_SSL_CA_PATH: string = "./ssl/db_ca.crt";

		@IsString()
		@Type(() => String)
		@Expose()
		@IsOptional()
		public DB_WORKFLOW_SSL_CERT_PATH: string = "./ssl/db_client.crt";

		@IsString()
		@Type(() => String)
		@Expose()
		@IsOptional()
		public DB_WORKFLOW_SSL_KEY_PATH: string = "./ssl/db_client.key";

		@Expose()
		@Transform(({ value }) => stringToBoolean(value))
		public DB_WORKFLOW_SSL_REJECT_UNAUTHORIZED!: boolean;

		@Expose()
		@IsOptional()
		@IsBoolean()
		@Transform(({ value }) => stringToBoolean(value))
		public DB_WORKFLOW_ENABLE_LOG: boolean = false;

		@Expose()
		@IsNumber()
		@Type(() => Number)
		@IsOptional()
		public DB_WORKFLOW_CONNECTION_LIMIT: number = 50;
	}

	return WorkflowDBEnvironment;
}

