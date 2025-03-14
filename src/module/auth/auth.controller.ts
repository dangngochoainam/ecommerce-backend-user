import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { WebJWTPayload } from "src/core/auth-gateway/auth-gateway.service";
import { UserSession } from "src/core/auth-gateway/auth-session.service";
import { JWTContent, JWTSession } from "src/core/auth-gateway/auth.decorator";
import { JwtGuard } from "src/core/auth-gateway/auth.guard";
import { NON_ENCRYPTION } from "src/core/crypto/crypto.decorator";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { LoginBodyDTO, LoginDto, LoginResponseDTO } from "src/shared/dto/auth/login.dto";
import { LogoutDTO, LogoutResponseDTO } from "src/shared/dto/auth/logout.dto";
import { RegisterDTO, RegisterRequestBodyDTO, RegisterResponseDTO } from "src/shared/dto/auth/register.dto";
import { RenewTokenBodyDTO, RenewTokenDto, RenewTokenResponseDTO } from "src/shared/dto/auth/renewToken.dto";
import { AuthService } from "./auth.service";
import { TraceId } from "src/core/interceptor/set-trace-id.interceptor";

@Controller()
export class AuthController {
	protected logger!: ContextLogger;

	constructor(
		public authService: AuthService,
		protected loggerService: LoggerService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	@NON_ENCRYPTION
	@Post(RegisterDTO.url)
	public async register(
		@TraceId() traceId: string,
		@Body() body: RegisterRequestBodyDTO,
	): Promise<RegisterResponseDTO> {
		return this.authService.register(traceId, body);
	}

	@NON_ENCRYPTION
	@Post(LoginDto.url)
	public async login(@Body() body: LoginBodyDTO): Promise<LoginResponseDTO> {
		return this.authService.login(body);
	}

	@Post(LogoutDTO.url)
	@UseGuards(
		JwtGuard({
			allowTokens: [WebJWTPayload],
			allowSessions: [UserSession],
		}),
	)
	@NON_ENCRYPTION
	public logout(
		@JWTContent() tokenPayload: WebJWTPayload,
		@JWTSession(UserSession)
		_sessionPayload: UserSession,
	): Promise<LogoutResponseDTO> {
		return this.authService.logout(tokenPayload);
	}

	@NON_ENCRYPTION
	@Post(RenewTokenDto.url)
	public async renewToken(@Body() body: RenewTokenBodyDTO): Promise<RenewTokenResponseDTO> {
		return this.authService.renewToken(body);
	}
}
