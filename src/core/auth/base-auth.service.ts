import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Exclude, Expose, instanceToPlain } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import * as uuid from "uuid";
import { REFRESH_TOKEN } from "../auth-gateway/auth-gateway.service";
import { AuthSessionService, BaseJwtSession } from "../auth-gateway/auth-session.service";
import { TokenSessionService } from "../auth-gateway/token-session.service";
import { CoreEnvironment, CoreEnvironmentService } from "../environment/environment.service";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { JWT_SESSION, SESSION_TYPE } from "../session/session-definition";

@Exclude()
export abstract class BaseJWTPayload {
	@Expose()
	@IsNumber()
	@IsOptional()
	public iat?: number;

	@Expose()
	@IsNumber()
	@IsOptional()
	public exp?: number;

	@Expose()
	@IsString()
	public key!: string;

	@Expose()
	@IsString()
	public id!: string;

	@Expose()
	@IsEnum(JWT_SESSION)
	public sessionChannel: JWT_SESSION = JWT_SESSION.JWT_SESSION;

	@Expose()
	public abstract type: string;

	public get sessionBoundId(): string {
		return `${this.key}:${this.id}`;
	}

	public needVerifyJwtSignature: boolean = true;
}

@Injectable()
export abstract class BaseAuthService {
	protected logger!: ContextLogger;

	public constructor(
		private envService: CoreEnvironmentService<CoreEnvironment>,
		protected loggerService: LoggerService,
		private jwtService: JwtService,
		private tokenSessionService: TokenSessionService,
		private authSessionService: AuthSessionService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	protected abstract buildTokenPayload(rawPayload: BaseJWTPayload): BaseJWTPayload;

	protected abstract buildTokenPublicPayload(rawPayload: BaseJWTPayload): BaseJWTPayload;

	protected async signJwt(
		payload: BaseJWTPayload,
		tokenLifeTime: number = this.envService.ENVIRONMENT.TOKEN_LIFETIME,
		secret?: string,
	): Promise<string> {
		const options: JwtSignOptions = {
			audience: this.envService.ENVIRONMENT.JWT_ISSUER,
			subject: payload.key,
			issuer: this.envService.ENVIRONMENT.JWT_ISSUER,
			expiresIn: tokenLifeTime,
			secret,
		};
		const content = instanceToPlain(this.buildTokenPublicPayload(payload));
		delete content.iat;
		delete content.exp;
		return this.jwtService.signAsync(content, options);
	}

	protected async clearSession(type: SESSION_TYPE, keys: string[]): Promise<void> {
		this.logger.info({}, "CLEAR SESSION KEYS: " + JSON.stringify(keys));
		await Promise.all(
			keys.map(async (key) => {
				await this.tokenSessionService.clearSession(type, key);
				await this.authSessionService.clearSession(type, key);
			}),
		);
	}

	protected async generateToken(
		payload: BaseJWTPayload,
		allowMultipleTokens: boolean = false,
		tokenLifeTime: number = this.envService.ENVIRONMENT.TOKEN_LIFETIME,
	): Promise<string> {
		const content = this.buildTokenPayload(payload);

		const existingToken = await this.tokenSessionService.getKeys(
			content.sessionChannel,
			content.sessionBoundId.replace(content.id, "*"),
		);
		if (!allowMultipleTokens && existingToken.length) {
			await this.clearSession(content.sessionChannel, existingToken);
		}

		delete content.iat;
		delete content.exp;
		await this.tokenSessionService.addSession(
			content.sessionChannel,
			content.sessionBoundId,
			tokenLifeTime,
			content,
		);

		return this.signJwt(payload, tokenLifeTime);
	}

	public async authenticate<SESSION extends BaseJwtSession>(
		payload: BaseJWTPayload,
		session: SESSION,
		tokenLifeTime: number = this.envService.ENVIRONMENT.TOKEN_LIFETIME,
		sessionLifeTime?: number,
	): Promise<string> {
		if (!payload.id) {
			payload.id = uuid.v4();
		}
		const token = await this.generateToken(payload, false, tokenLifeTime);

		const content = this.buildTokenPayload(payload);

		await this.authSessionService.addSession(
			content.sessionChannel,
			content.sessionBoundId,
			sessionLifeTime || tokenLifeTime,
			{
				...session,
				key: content.sessionBoundId,
				tokenIDs: [...(session.tokenIDs || []), content.id],
			},
		);

		return token;
	}

	public async logout(content: BaseJWTPayload): Promise<void> {
		await this.clearSession(content.sessionChannel, [content.sessionBoundId]);
	}

	public async renewToken(
		payload: BaseJWTPayload,
		allowMultipleTokens: boolean = true,
		tokenLifeTime: number = this.envService.ENVIRONMENT.TOKEN_LIFETIME,
	): Promise<string> {
		if (!REFRESH_TOKEN.includes(payload.type)) {
			this.logger.error({}, "TOKEN TYPE NOT ALLOW TO REFRESH: " + payload.type, undefined);
			throw new UnauthorizedException(SYSTEM_CODE.TOKEN_IS_NOT_ALLOW_TO_REFRESH);
		}

		const exp = payload.exp || 0;
		const now = Date.now() / 1000;
		if (exp + this.envService.ENVIRONMENT.TOKEN_REFRESH_TIME_WINDOW < now) {
			this.logger.error({}, "TOKEN EXPIRED TIME: " + exp, undefined);
			this.logger.error(
				{},
				"TOKEN_REFRESH_TIME_WINDOW: " + this.envService.ENVIRONMENT.TOKEN_REFRESH_TIME_WINDOW,
				undefined,
			);
			throw new UnauthorizedException(SYSTEM_CODE.TOKEN_IS_NOT_ALLOW_TO_REFRESH);
		}

		const token = this.generateToken(payload, allowMultipleTokens, tokenLifeTime);

		const currentSession = await this.authSessionService.getSessionValue(
			payload.sessionChannel,
			payload.sessionBoundId,
		);
		await this.authSessionService.addSession(
			payload.sessionChannel,
			payload.sessionBoundId,
			this.envService.ENVIRONMENT.TOKEN_REFRESH_TIME_WINDOW,
			currentSession,
		);

		return token;
	}
}
