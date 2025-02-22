import { Injectable } from "@nestjs/common";
import { ClassConstructor, Exclude, Expose } from "class-transformer";
import { IsEnum, IsIn, IsString } from "class-validator";
import { LoggerService } from "../logger/logger.service";
import { SessionRedisStorage } from "../session/session-storage.service";
import { BaseSessionService } from "../session/session.service";

export enum SESSION_TYPE {
	USER_SESSION = "USER_SESSION",
	ADMIN_SESSION = "ADMIN_SESSION",
	// AGENT_SESSION = "AGENT_SESSION",
	// AGENT_USER_SESSION = "AGENT_USER_SESSION",
	// FUND_TRANSFER_SESSION = "FUND_TRANSFER_SESSION",
	// PARTNER_SESSION = "PARTNER_SESSION",
	// PARTNER_USER_SESSION = "PARTNER_USER_SESSION",
	// OCTO_WEB_SESSION = "OCTO_WEB_SESSION",
	// SIGN_CONTRACT_SESSION = "SIGN_CONTRACT_SESSION",
	// OCTO_GUEST_SESSION = "OCTO_GUEST_SESSION",
}

@Exclude()
export abstract class BaseJwtSession {
	@Expose()
	@IsString()
	public key!: string;

	// @Expose()
	// @IsArray()
	// public permissions: SESSION_PERMISSION[] = [];

	@Expose()
	@IsEnum(SESSION_TYPE)
	abstract readonly type: SESSION_TYPE;

	public tokenIDs!: string[];
}

@Exclude()
export class UserSession extends BaseJwtSession {
	// @Expose()
	// @IsEnum(USER_PERMISSION, { each: true })
	// public permissions: USER_PERMISSION[] = [];

	@Expose()
	@IsIn([SESSION_TYPE.USER_SESSION])
	public readonly type: SESSION_TYPE = SESSION_TYPE.USER_SESSION;

	@Expose()
	public userId!: string;
}

@Exclude()
export class AdminSession extends BaseJwtSession {
	// @Expose()
	// @IsEnum(USER_PERMISSION, { each: true })
	// public permissions: USER_PERMISSION[] = [];

	@Expose()
	@IsIn([SESSION_TYPE.ADMIN_SESSION])
	public readonly type: SESSION_TYPE = SESSION_TYPE.ADMIN_SESSION;

	@Expose()
	public userId!: string;
}

type SessionType<T extends BaseJwtSession> = {
	[k in SESSION_TYPE]: ClassConstructor<T>;
};

class SessionTypeMap implements SessionType<BaseJwtSession> {
	public [SESSION_TYPE.USER_SESSION] = UserSession as ClassConstructor<BaseJwtSession>;
	public [SESSION_TYPE.ADMIN_SESSION] = AdminSession;
}

export const SESSION_TYPE_MAP = new SessionTypeMap();

@Injectable()
export class AuthSessionService extends BaseSessionService<"AUTH", BaseJwtSession> {
	public readonly NAMESPACE = "AUTH";

	public constructor(
		public storage: SessionRedisStorage,
		protected loggerService: LoggerService,
	) {
		super(storage, loggerService);
	}

	protected valueDeserializer = JSON.parse;

	protected valueSerializer = JSON.stringify;
}
