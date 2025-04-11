import { Expose, Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { stringToBoolean } from "src/shared/utils/class-transformer";

export function TransitEnvironmentClass<K extends ConstructorFunction<any>>(TargetClass: K) {
	class TransitEnvironment extends TargetClass {
		@Expose()
		@IsString()
		public DB_TRANSIT_HOST!: string;

		@Expose()
		@IsNumber()
		@Type(() => Number)
		public DB_TRANSIT_PORT!: number;

		@Expose()
		@IsString()
		public DB_TRANSIT_USERNAME!: string;

		@Expose()
		@IsString()
		// @Transform(({ value, obj }) => decryptEnvValueByAES(value, obj.PASSWORD_ENCRYPTION_KEY))
		public DB_TRANSIT_PASSWORD!: string;

		@Expose()
		@IsString()
		public DB_TRANSIT_DATABASE!: number;

		@Expose()
		@IsString()
		public DB_TRANSIT_SCHEMA!: number;

		@Expose()
		@Transform(({ value }) => stringToBoolean(value))
		public DB_TRANSIT_SSL_ENABLED!: boolean;

		@IsString()
		@Type(() => String)
		@Expose()
		@IsOptional()
		public DB_TRANSIT_SSL_CA_PATH: string = "./ssl/db_ca.crt";

		@IsString()
		@Type(() => String)
		@Expose()
		@IsOptional()
		public DB_TRANSIT_SSL_CERT_PATH: string = "./ssl/db_client.crt";

		@IsString()
		@Type(() => String)
		@Expose()
		@IsOptional()
		public DB_TRANSIT_SSL_KEY_PATH: string = "./ssl/db_client.key";

		@Expose()
		@Transform(({ value }) => stringToBoolean(value))
		public DB_TRANSIT_SSL_REJECT_UNAUTHORIZED!: boolean;

		@Expose()
		@IsOptional()
		@IsBoolean()
		@Transform(({ value }) => stringToBoolean(value))
		public DB_TRANSIT_ENABLE_LOG: boolean = false;

		@Expose()
		@IsNumber()
		@Type(() => Number)
		@IsOptional()
		public DB_TRANSIT_CONNECTION_LIMIT: number = 20;
	}
	return TransitEnvironment;
}
