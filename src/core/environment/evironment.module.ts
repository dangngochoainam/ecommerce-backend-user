import { DynamicModule, Global, Module } from "@nestjs/common";
import { CoreEnvironment, CoreEnvironmentProvider, CoreEnvironmentService } from "./environment.service";

@Global()
@Module({})
export class CoreEnvironmentModule {
	public static create<T extends CoreEnvironment>(envClass: ConstructorFunction<T>): DynamicModule {
		const env = new CoreEnvironmentService(envClass);
		return {
			module: CoreEnvironmentModule,
			providers: [
				CoreEnvironmentProvider,
				{
					provide: CoreEnvironmentService,
					useValue: env,
				},
				{
					provide: envClass,
					useValue: env,
				},
			],
			exports: [CoreEnvironmentService, envClass],
		};
	}
}
