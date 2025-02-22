import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Exclude, Expose, plainToInstance } from "class-transformer";
import { BaseAuthService, BaseJWTPayload } from "../auth/base-auth.service";
import { IsEnum, IsIn } from "class-validator";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";

export enum TOKEN_TYPE {
	WEB = "WEB_USER",
	APP_USER = "MOBILE_USER",
	// WEB_ADMIN = "WEB_ADMIN",
	// APP_ADMIN = "WEB_ADMIN",
}

export const REFRESH_TOKEN: string[] = [TOKEN_TYPE.WEB];

@Exclude()
export abstract class JWTGatewayPayload extends BaseJWTPayload {
	@Expose()
	@IsEnum(TOKEN_TYPE)
	public abstract type: TOKEN_TYPE;
}

@Exclude()
export class JWTPublicPayload extends JWTGatewayPayload {
	@Expose()
	@IsEnum(TOKEN_TYPE)
	public type!: TOKEN_TYPE;
}

@Exclude()
export class WebJWTPayload extends JWTGatewayPayload {
	@Expose()
	@IsIn([TOKEN_TYPE.WEB])
	public readonly type: TOKEN_TYPE = TOKEN_TYPE.WEB;
}

@Exclude()
export class AppUserJWTPayload extends JWTGatewayPayload {
	@Expose()
	@IsIn([TOKEN_TYPE.APP_USER])
	public readonly type: TOKEN_TYPE = TOKEN_TYPE.APP_USER;
}

type TokenMap<T extends JWTGatewayPayload> = {
	[k in TOKEN_TYPE]: ConstructorFunction<T>;
};
export class TokenTypeMap implements TokenMap<JWTGatewayPayload> {
	public [TOKEN_TYPE.WEB] = WebJWTPayload as ConstructorFunction<JWTGatewayPayload>;
	public [TOKEN_TYPE.APP_USER] = AppUserJWTPayload;
}
export const TOKEN_TYPE_MAP = new TokenTypeMap();

@Injectable()
export class AuthGatewayService extends BaseAuthService {
	public buildTokenPublicPayload(payload: JWTGatewayPayload): JWTGatewayPayload {
		return plainToInstance(JWTPublicPayload, payload, { exposeDefaultValues: true });
	}

	protected buildTokenPayload(payload: JWTGatewayPayload): JWTGatewayPayload {
		const tokenClass = TOKEN_TYPE_MAP[payload.type] as ConstructorFunction<JWTGatewayPayload>;
		if (!tokenClass) {
			throw new InternalServerErrorException(SYSTEM_CODE.INTERNAL_ERROR_OCCURRED);
		}
		return plainToInstance(tokenClass, payload, { exposeDefaultValues: true });
	}
}
