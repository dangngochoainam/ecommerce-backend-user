import { Module } from "@nestjs/common";
import { AuthGatewayModule } from "src/core/auth-gateway/auth-gateway.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserRepositoryModule } from "../database-access-operations/user/user.repository.module";

@Module({
	imports: [AuthGatewayModule, UserRepositoryModule],
	providers: [AuthService],
	exports: [AuthService],
	controllers: [AuthController],
})
export class AuthModule {}
