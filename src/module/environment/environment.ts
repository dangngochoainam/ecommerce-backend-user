import { ValueProvider } from "@nestjs/common";
import { Exclude, Expose } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { CoreEnvironment, CoreEnvironmentService } from "src/core/environment/environment.service";
import { UserDBEnvironmentClass } from "src/db-user/environment";

@Exclude()
export class UserEnvironment extends UserDBEnvironmentClass(CoreEnvironment) {
	// add environment of servier at here
	@IsOptional()
	@IsString()
	@Expose()
	public USER_HOST = "";
}

export class UserEnvironmentService extends CoreEnvironmentService<UserEnvironment> {}

export const UserEnvironmentProvider: ValueProvider<UserEnvironmentService> = {
	provide: UserEnvironmentService,
	useValue: new UserEnvironmentService(UserEnvironment),
};
