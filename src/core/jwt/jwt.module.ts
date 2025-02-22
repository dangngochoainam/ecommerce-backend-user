import { JwtModule } from "@nestjs/jwt";
import { CoreEnvironment, CoreEnvironmentService } from "../environment/environment.service";

export const CoreJwtModule = JwtModule.registerAsync({
	useFactory: async (envService: CoreEnvironmentService<CoreEnvironment>) => {
		return {
			global: true,
			secret: envService.ENVIRONMENT.JWT_SECRET,
		};
	},
	inject: [CoreEnvironmentService],
});
