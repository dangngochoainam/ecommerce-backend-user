import { CanActivate, ExecutionContext, Injectable, mixin, Type, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import { BaseJWTPayload } from "../auth/base-auth.service";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { TOKEN_TYPE, TOKEN_TYPE_MAP } from "./auth-gateway.service";
import { AuthSessionService, BaseJwtSession, SESSION_TYPE_MAP } from "./auth-session.service";
import { TokenSessionService } from "./token-session.service";
import { HEADER } from "src/shared/constants/http.constant";

export function JwtGuard(params: {
	allowTokens: Array<ClassConstructor<BaseJWTPayload>>;
	allowSessions: Array<ClassConstructor<BaseJwtSession>>;
	needVerifyJwtSignature?: boolean;
}): Type<CanActivate> {
	const { needVerifyJwtSignature, allowTokens, allowSessions } = params;
	@Injectable()
	class JWTDynamicGuard implements CanActivate {
		private logger!: ContextLogger;

		public constructor(
			protected readonly loggerService: LoggerService,
			private readonly tokenSessionService: TokenSessionService,
			private readonly authSessionService: AuthSessionService,
			private readonly jwtService: JwtService,
		) {
			this.logger = loggerService.newContextLogger(this.constructor.name);
		}
		async canActivate(context: ExecutionContext): Promise<boolean> {
			const request = context.switchToHttp().getRequest();
			const traceId = request.headers[HEADER.TRACE_ID] as string;
			this.logger.debug({ traceId }, params);
			try {
				const token = request.headers.authorization;
				if (!token) {
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}

				const jwtToken = token.startsWith("Bearer") ? token.split(" ")[1] : token;
				const payload = needVerifyJwtSignature
					? this.jwtService.sign(jwtToken)
					: this.jwtService.decode(jwtToken);
				const rawPayload: { type: TOKEN_TYPE; iat: Date; exp: number } =
					typeof payload === "string" ? JSON.parse(payload) : payload;
				if (rawPayload.exp < Date.now() / 1000) {
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}

				const tokenClass = TOKEN_TYPE_MAP[rawPayload.type];
				if (!tokenClass) {
					this.logger.error({ traceId }, "TOKEN TYPE NOT FOUND!", undefined);
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}

				if (allowTokens && !allowTokens.includes(tokenClass)) {
					this.logger.error({ traceId }, "TOKEN TYPE NOT PERMIISION!", undefined);
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}

				const userFromToken = plainToInstance(tokenClass, rawPayload, { exposeDefaultValues: true });
				const content = await this.tokenSessionService.getSessionValue(
					userFromToken.sessionChannel,
					userFromToken.sessionBoundId,
				);

				if (needVerifyJwtSignature === undefined && content.needVerifyJwtSignature) {
					this.jwtService.verify(jwtToken);
				}
				if (content.exp && content.exp < Date.now() / 1000) {
					this.logger.error({ traceId }, "TOKEN EXPIRED!", undefined);
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}
				if (userFromToken.type !== content.type) {
					this.logger.error({ traceId }, "TOKEN TYPE NOT MATCH!", undefined);
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}

				const tokenContent = plainToInstance(tokenClass, content, { exposeDefaultValues: true });
				request.token = tokenContent;

				const session = await this.authSessionService.getSessionValue(
					userFromToken.sessionChannel,
					userFromToken.sessionBoundId,
				);

				const sessionClass = SESSION_TYPE_MAP[session.type];
				if (allowSessions && !allowSessions.includes(sessionClass)) {
					this.logger.error({ traceId }, "SESSION TYPE NOT PERMIISION!", undefined);
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}

				request.session = session as BaseJwtSession;

				return true;
			} catch (e: unknown) {
				const { message } = e as Error;
				this.logger.debug({ traceId }, message);
				throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
			}
		}
	}
	return mixin(JWTDynamicGuard);
}
