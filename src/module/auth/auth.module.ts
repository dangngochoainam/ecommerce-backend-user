import { Module } from "@nestjs/common";
import { AuthGatewayModule } from "src/core/auth-gateway/auth-gateway.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
	imports: [AuthGatewayModule],
	providers: [AuthService],
	exports: [AuthService],
	controllers: [AuthController],
})
export class AuthModule {}
