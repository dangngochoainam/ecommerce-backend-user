import { Injectable, Logger, ValueProvider } from "@nestjs/common";
import { Exclude, Expose, plainToClass, Transform, Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, validateSync } from "class-validator";
import { createWriteStream } from "fs";
import { optionalStringToBoolean, stringToBoolean } from "src/shared/utils/class-transformer";

@Exclude()
export class CoreEnvironment {
	@Expose()
	@IsString()
	@Type(() => String)
	public NODE_ENV: string = "dev";

	@Expose()
	@IsString()
	@Type(() => String)
	public APP_BASE_URL: string = "api/v1";

	@Expose()
	@IsBoolean()
	@Transform(optionalStringToBoolean)
	public SHOW_DEBUG_ERROR: boolean = false;

	@Expose()
	@IsString()
	@Type(() => String)
	public INSTANCE_ID: string = "unset instanceId";

	@Expose()
	@IsNumber()
	@Type(() => Number)
	@IsNotEmpty()
	public PORT!: number;

	@Expose()
	@IsBoolean()
	@Transform(({ value }) => stringToBoolean(value))
	@IsNotEmpty()
	public LOG_DEBUG_MODE: boolean = false;

	// DB-LOG connection
	@Expose()
	@IsString()
	@Type(() => String)
	@IsNotEmpty()
	public DB_LOG_HOST!: string;

	@Expose()
	@IsNumber()
	@Type(() => Number)
	@IsNotEmpty()
	public DB_LOG_PORT!: number;

	@Expose()
	@IsString()
	@Type(() => String)
	@IsNotEmpty()
	public DB_LOG_DATABASE!: string;

	@Expose()
	@IsString()
	@Type(() => String)
	@IsNotEmpty()
	public DB_LOG_SCHEMA!: string;

	@Expose()
	@IsString()
	@Type(() => String)
	@IsNotEmpty()
	public DB_LOG_USERNAME!: string;

	@Expose()
	@IsString()
	@Type(() => String)
	@IsNotEmpty()
	public DB_LOG_PASSWORD!: string;

	// RabbitMQ
	@Expose()
	@IsString()
	public MQ_HOSTNAME: string = "amqp:5672";

	@IsString()
	@Type(() => String)
	@Expose()
	public MQ_USERNAME: string = "guest";

	@IsString()
	@Type(() => String)
	@Expose()
	public MQ_PASSWORD: string = "guest";

	// Redis connection
	@IsString()
	@Type(() => String)
	@Expose()
	public REDIS_HOST: string = "localhost";

	@IsNumber()
	@Type(() => Number)
	@Expose()
	public REDIS_PORT: number = 6379;

	@IsString()
	@Expose()
	@IsOptional()
	public REDIS_USERNAME?: string;

	@IsString()
	@Expose()
	@IsOptional()
	// @Transform(({ value, obj }) => decryptEnvValueByAES(value, obj.PASSWORD_ENCRYPTION_KEY))
	public REDIS_PASSWORD?: string;

	@IsBoolean()
	@Expose()
	@IsOptional()
	@Transform(optionalStringToBoolean)
	public REDIS_SSL_ENABLED: boolean = false;

	@IsString()
	@Expose()
	@IsOptional()
	public REDIS_SSL_CA_CERT_PATH: string = "";

	@IsString()
	@Expose()
	@IsOptional()
	public REDIS_SSL_CERT_PATH: string = "";

	@IsString()
	@Expose()
	@IsOptional()
	public REDIS_SSL_KEY_PATH: string = "";

	@IsNumber()
	@Expose()
	@Type(() => Number)
	@IsOptional()
	public REDIS_TIMEOUT: number = 10000;

	@IsBoolean()
	@Expose()
	@IsOptional()
	@Transform(optionalStringToBoolean)
	public REDIS_SSL_REJECT_UNAUTHORIZED: boolean = true;

	@Expose()
	@IsNumber()
	@Type(() => Number)
	public THROTTLE_TTL!: number;

	@Expose()
	@IsNumber()
	@Type(() => Number)
	public THROTTLE_LIMIT!: number;

	// SETUP JWT
	@IsString()
	@Expose()
	public JWT_SECRET!: string;

	@IsString()
	@Expose()
	public JWT_ISSUER: string = "CIMB";

	@IsNumber()
	@Type(() => Number)
	@Expose()
	public TOKEN_LIFETIME = 60; // seconds

	@IsNumber()
	@Type(() => Number)
	@Expose()
	public TOKEN_REFRESH_TIME_WINDOW = 300; // seconds

	@IsNotEmpty()
	@IsString()
	@Expose()
	public RSA_PUBLIC_KEY = "";

	@IsNotEmpty()
	@IsString()
	@Expose()
	public RSA_PRIVATE_KEY = "";
}

@Injectable()
export class CoreEnvironmentService<T extends CoreEnvironment> {
	protected logger = new Logger(this.constructor.name);

	public ENVIRONMENT: T;

	constructor(envClass: ConstructorFunction<T>) {
		this.ENVIRONMENT = plainToClass(
			envClass,
			{
				...new envClass(), // Include default value
				...process.env, // ENV override
			},
			{
				excludeExtraneousValues: true,
			},
		);

		const errors = validateSync(this.ENVIRONMENT, { skipMissingProperties: false });

		if (errors.length > 0) {
			this.logger.log(this.ENVIRONMENT);
			throw errors;
		}

		// Output environment template
		if (this.ENVIRONMENT.NODE_ENV !== "production") {
			const content = createWriteStream("./env-template.sh");
			Object.entries(this.ENVIRONMENT).forEach((entry) => content.write(`export ${entry[0]}=${entry[1]} \n`));
			content.close();
		}
	}
}

export const CoreEnvironmentProvider: ValueProvider<CoreEnvironmentService<CoreEnvironment>> = {
	provide: CoreEnvironmentService,
	useValue: new CoreEnvironmentService(CoreEnvironment),
};
