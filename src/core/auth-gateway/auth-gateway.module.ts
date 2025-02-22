import { Global, Module } from "@nestjs/common";
import { CoreJwtModule } from "../jwt/jwt.module";
import { SessionRedisStorage } from "../session/session-storage.service";
import { AuthGatewayService } from "./auth-gateway.service";
import { AuthSessionService } from "./auth-session.service";
import { TokenSessionService } from "./token-session.service";

@Global()
@Module({
	imports: [CoreJwtModule],
	providers: [AuthGatewayService, SessionRedisStorage, AuthSessionService, TokenSessionService],
	controllers: [],
	exports: [CoreJwtModule, AuthGatewayService, SessionRedisStorage, AuthSessionService, TokenSessionService],
})
export class AuthGatewayModule {}
