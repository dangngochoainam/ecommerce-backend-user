import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { plainToInstance } from "class-transformer";
import { AuthGatewayService, JWTPublicPayload, WebJWTPayload } from "src/core/auth-gateway/auth-gateway.service";
import { UserSession } from "src/core/auth-gateway/auth-session.service";
import { CoreEnvironment, CoreEnvironmentService } from "src/core/environment/environment.service";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { LoginBodyDTO, LoginResponseDTO } from "src/shared/dto/auth/login.dto";
import { LogoutResponseDTO } from "src/shared/dto/auth/logout.dto";
import { RenewTokenBodyDTO, RenewTokenResponseDTO } from "src/shared/dto/auth/renewToken.dto";

@Injectable()
export class AuthService {
	protected logger!: ContextLogger;

	constructor(
		protected readonly loggerService: LoggerService,
		private authGatewayService: AuthGatewayService,
		private jwtService: JwtService,
		private envService: CoreEnvironmentService<CoreEnvironment>,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async login(body: LoginBodyDTO): Promise<LoginResponseDTO> {
		return {
			token: await this.authGatewayService.authenticate<UserSession>(
				plainToInstance(
					WebJWTPayload,
					{
						key: "encryt_user_id",
					},
					{ exposeDefaultValues: true },
				),
				plainToInstance(
					UserSession,
					{
						userId: body.userId,
					},
					{ exposeDefaultValues: true },
				),
				this.envService.ENVIRONMENT.TOKEN_LIFETIME,
				+this.envService.ENVIRONMENT.TOKEN_REFRESH_TIME_WINDOW,
			),
		};
	}

	public async logout(tokenPayload: WebJWTPayload): Promise<LogoutResponseDTO> {
		await this.authGatewayService.logout(tokenPayload);
		return { isSuccess: true };
	}

	public async renewToken(body: RenewTokenBodyDTO): Promise<RenewTokenResponseDTO> {
		const rawPayload: JWTPublicPayload = this.jwtService.decode(body.token);

		const userFromToken = this.authGatewayService.buildTokenPublicPayload(rawPayload);
		const token = await this.authGatewayService.renewToken(
			plainToInstance(WebJWTPayload, userFromToken, { exposeDefaultValues: true }),
		);

		return plainToInstance(RenewTokenResponseDTO, { token });
	}
}
