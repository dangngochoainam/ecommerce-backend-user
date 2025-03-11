import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { readFileSync } from "fs";
import { Redis } from "ioredis";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthGatewayModule } from "./core/auth-gateway/auth-gateway.module";
import { CryptoModule } from "./core/crypto/crypto.module";
import { CoreEnvironment, CoreEnvironmentService } from "./core/environment/environment.service";
import { CoreEnvironmentModule } from "./core/environment/evironment.module";
import { DBLogger } from "./core/logger/db-logger";
import { LoggerModule, SQL_LOGGER_PROVIDER } from "./core/logger/logger.module";
import { LogDbModule } from "./db-log/db.module";
import { SqlLoggerService } from "./db-log/module/sql-logger/sql-logger.service";
import { typeOrmOptions as exampleTypeOrmOptions } from "./db-user/typeorm.module";
import { AuthModule } from "./module/auth/auth.module";
import { UserEnvironment } from "./module/environment/environment";
import { UserResponseInterceptor } from "./module/interceptor/response.interceptor";
import { UserModule } from "./module/user/user.module";
import { FetchModule } from "./core/fetch/fetch.module";
import { CryptoInterceptor } from "./core/crypto/crypto.interceptor";

@Module({
	imports: [
		LogDbModule.create({
			useFactory: (env: CoreEnvironmentService<CoreEnvironment>) => {
				return {
					host: env.ENVIRONMENT.DB_LOG_HOST,
					port: env.ENVIRONMENT.DB_LOG_PORT,
					database: env.ENVIRONMENT.DB_LOG_DATABASE,
					schema: env.ENVIRONMENT.DB_LOG_SCHEMA,
					username: env.ENVIRONMENT.DB_LOG_USERNAME,
					password: env.ENVIRONMENT.DB_LOG_PASSWORD,
				};
			},
			inject: [CoreEnvironmentService],
		}),
		LoggerModule.factory("User__Service"),
		CoreEnvironmentModule.create(UserEnvironment),
		TypeOrmModule.forRootAsync({
			name: exampleTypeOrmOptions.name,
			inject: [CoreEnvironmentService, SQL_LOGGER_PROVIDER],
			useFactory: (env: CoreEnvironmentService<UserEnvironment>, sqlLoggerService: SqlLoggerService) =>
				({
					host: env.ENVIRONMENT.DB_USER_HOST,
					port: env.ENVIRONMENT.DB_USER_PORT,
					schema: env.ENVIRONMENT.DB_USER_SCHEMA,
					database: env.ENVIRONMENT.DB_USER_DATABASE,
					username: env.ENVIRONMENT.DB_USER_USERNAME,
					password: env.ENVIRONMENT.DB_USER_PASSWORD,
					...exampleTypeOrmOptions,
					logger: new DBLogger(sqlLoggerService, "User__Service__DB", exampleTypeOrmOptions.name || ""),
					cache: {
						type: "ioredis",
						options: {
							host: env.ENVIRONMENT.REDIS_HOST,
							port: env.ENVIRONMENT.REDIS_PORT,
							password: env.ENVIRONMENT.REDIS_PASSWORD,
						},
					},
				}) as TypeOrmModuleOptions,
		}),
		UserModule,
		ThrottlerModule.forRootAsync({
			useFactory: (env: CoreEnvironmentService<CoreEnvironment>) => {
				return {
					throttlers: [
						{
							ttl: env.ENVIRONMENT.THROTTLE_TTL,
							limit: env.ENVIRONMENT.THROTTLE_LIMIT,
						},
					],
					storage: new ThrottlerStorageRedisService(
						new Redis({
							host: env.ENVIRONMENT.REDIS_HOST,
							port: env.ENVIRONMENT.REDIS_PORT,
							connectTimeout: env.ENVIRONMENT.REDIS_TIMEOUT,
							username: env.ENVIRONMENT.REDIS_USERNAME,
							password: env.ENVIRONMENT.REDIS_PASSWORD,
							...(env.ENVIRONMENT.REDIS_SSL_ENABLED
								? {
										tls: {
											ca: readFileSync(env.ENVIRONMENT.REDIS_SSL_CA_CERT_PATH),
											cert: readFileSync(env.ENVIRONMENT.REDIS_SSL_CERT_PATH),
											key: readFileSync(env.ENVIRONMENT.REDIS_SSL_KEY_PATH),
											rejectUnauthorized: env.ENVIRONMENT.REDIS_SSL_REJECT_UNAUTHORIZED,
										},
									}
								: {}),
							showFriendlyErrorStack: env.ENVIRONMENT.NODE_ENV !== "production",
						}),
					),
				};
			},
			inject: [CoreEnvironmentService],
		}),
		AuthGatewayModule,
		AuthModule,
		FetchModule.register({
			useFactory: (env: CoreEnvironmentService<UserEnvironment>) => {
				return {
					targetHost: env.ENVIRONMENT.USER_HOST,
				};
			},
			inject: [CoreEnvironmentService],
		}),
		CryptoModule.register({
			useFactory: (env: CoreEnvironmentService<CoreEnvironment>) => {
				return {
					privateKey: env.ENVIRONMENT.RSA_PRIVATE_KEY,
					publicKey: env.ENVIRONMENT.RSA_PUBLIC_KEY,
				};
			},
			inject: [CoreEnvironmentService],
		}),
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_INTERCEPTOR,
			useClass: CryptoInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: UserResponseInterceptor,
		},
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
