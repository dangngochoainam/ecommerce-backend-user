import { Exclude, Expose, Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";
export function UserDBEnvironmentClass<K extends ConstructorFunction<any>>(TargetClass: K) {
	@Exclude()
	class UserEnvironment extends TargetClass {
		@Expose()
		@IsString()
		public DB_USER_HOST!: string;

		@Expose()
		@IsNumber()
		@Type(() => Number)
		public DB_USER_PORT!: number;

		@Expose()
		@IsString()
		public DB_USER_USERNAME!: string;

		@Expose()
		@IsString()
		// @Transform(({ value, obj }) => decryptEnvValueByAES(value, obj.PASSWORD_ENCRYPTION_KEY))
		public DB_USER_PASSWORD!: string;

		@Expose()
		@IsString()
		public DB_USER_DATABASE!: string;

		@Expose()
		@IsString()
		public DB_USER_SCHEMA!: string;
	}
	return UserEnvironment;
}
