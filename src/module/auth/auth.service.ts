import {BadRequestException, Injectable} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {plainToInstance} from "class-transformer";
import {AuthGatewayService, JWTPublicPayload, WebJWTPayload} from "src/core/auth-gateway/auth-gateway.service";
import {UserSession} from "src/core/auth-gateway/auth-session.service";
import {CoreEnvironment, CoreEnvironmentService} from "src/core/environment/environment.service";
import {ContextLogger, LoggerService} from "src/core/logger/logger.service";
import {LoginBodyDTO, LoginResponseDTO} from "src/shared/dto/auth/login.dto";
import {LogoutResponseDTO} from "src/shared/dto/auth/logout.dto";
import {RegisterRequestBodyDTO, RegisterResponseDTO} from "src/shared/dto/auth/register.dto";
import {RenewTokenBodyDTO, RenewTokenResponseDTO} from "src/shared/dto/auth/renewToken.dto";
import {UserRepository} from "../database-access-operations/user/user.repository";
import {User} from "src/db-user/entity/user.entity";
import {SYSTEM_CODE} from "src/shared/dto/code/system-code";
import {CryptoService} from "src/core/crypto/crypto.service";

@Injectable()
export class AuthService {
    protected logger!: ContextLogger;

    constructor(
        protected readonly loggerService: LoggerService,
        private readonly authGatewayService: AuthGatewayService,
        private readonly cryptoService: CryptoService,
        private readonly jwtService: JwtService,
        private readonly envService: CoreEnvironmentService<CoreEnvironment>,
        private readonly userRepository: UserRepository,
    ) {
        this.logger = loggerService.newContextLogger(this.constructor.name);
    }

    public async register(body: RegisterRequestBodyDTO): Promise<RegisterResponseDTO> {
        const {email, password, name} = body;

        const existingEmail = await this.userRepository.sqlFindOne(undefined, {
            where: {
                email,
            },
        });

        if (existingEmail) {
            const errorMessage = `User with email ${email} already exists.`;
            const error = new BadRequestException(SYSTEM_CODE.BAD_REQUEST);
            this.logger.error({}, errorMessage, error);
            throw error;
        }

        const hashedPassword = await this.cryptoService.hashPassword(password);
        const createdUser = plainToInstance(User, {email, password: hashedPassword, name});
        await this.userRepository.sqlInsert(undefined, createdUser);

        return plainToInstance(RegisterResponseDTO, {isSuccess: true});
    }

    public async login(body: LoginBodyDTO): Promise<LoginResponseDTO> {
        const currentUser = await this.userRepository.sqlFindOne(undefined, {
            where: {
                email: body.email,
            },
        });

        if (!currentUser) {
            const errorMessage = `User with email ${body.email} not found.`;
            const error = new BadRequestException(SYSTEM_CODE.BAD_REQUEST);
            this.logger.error({}, errorMessage, error);
            throw error;
        }

        const isPasswordValid = await this.cryptoService.verifyPassword(body.password, currentUser.password);
        if (!isPasswordValid) {
            const errorMessage = `User with email ${body.email} has invalid password.`;
            const error = new BadRequestException(SYSTEM_CODE.BAD_REQUEST);
            this.logger.error({}, errorMessage, error);
            throw error;
        }

        const encryptedUserId = this.cryptoService
            .encryptRSA(Buffer.from(currentUser.id.toString(), "utf-8"))
            .toString("base64");

        return {
            token: await this.authGatewayService.authenticate<UserSession>(
                plainToInstance(
                    WebJWTPayload,
                    {
                        key: encryptedUserId,
                    },
                    {exposeDefaultValues: true},
                ),
                plainToInstance(
                    UserSession,
                    {
                        userId: currentUser.id,
                    },
                    {exposeDefaultValues: true},
                ),
                this.envService.ENVIRONMENT.TOKEN_LIFETIME,
                +this.envService.ENVIRONMENT.TOKEN_REFRESH_TIME_WINDOW,
            ),
        };
    }

    public async logout(tokenPayload: WebJWTPayload): Promise<LogoutResponseDTO> {
        await this.authGatewayService.logout(tokenPayload);
        return {isSuccess: true};
    }

    public async renewToken(body: RenewTokenBodyDTO): Promise<RenewTokenResponseDTO> {
        const rawPayload: JWTPublicPayload = this.jwtService.decode(body.token);

        const userFromToken = this.authGatewayService.buildTokenPublicPayload(rawPayload);
        const token = await this.authGatewayService.renewToken(
            plainToInstance(WebJWTPayload, userFromToken, {exposeDefaultValues: true}),
        );

        return plainToInstance(RenewTokenResponseDTO, {token});
    }
}
