import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/db-user/entity/user.entity";
import { CONNECTION_NAME } from "src/db-user/typeorm.module";
import { UserRepository } from "./user.repository";

@Module({
	imports: [TypeOrmModule.forFeature([User], CONNECTION_NAME)],
	providers: [UserRepository],
	exports: [UserRepository],
})
export class UserRepositoryModule {}
