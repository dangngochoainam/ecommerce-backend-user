import { Module } from "@nestjs/common";
import { UserRepositoryModule } from "../database-access-operations/user/user.repository.module";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

@Module({
	imports: [UserRepositoryModule],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
