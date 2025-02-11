import {ValueProvider} from "@nestjs/common";
import {Exclude} from "class-transformer";
import {CoreEnvironment, CoreEnvironmentService} from "src/core/environment/environment.service";
import {UserDBEnvironmentClass} from "src/db-user/environment";

@Exclude()
export class UserEnvironment extends UserDBEnvironmentClass(CoreEnvironment) {
    // add environment of servier at here
}

export class UserEnvironmentService extends CoreEnvironmentService<UserEnvironment> {
}

export const UserEnvironmentProvider: ValueProvider<UserEnvironmentService> = {
    provide: UserEnvironmentService,
    useValue: new UserEnvironmentService(UserEnvironment),
};
