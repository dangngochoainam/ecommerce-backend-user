import { DynamicModule, FactoryProvider, Global, Module } from "@nestjs/common";
import { FetchService, IFetchOptions } from "./fetch.service";
import { LoggerService } from "src/core/logger/logger.service";

@Global()
@Module({})
export class FetchModule {
	public static register(opts: Omit<FactoryProvider<IFetchOptions>, "provide">): DynamicModule {
		return {
			module: FetchModule,
			imports: [],
			providers: [
				{
					provide: "options",
					...opts,
				},
				{
					provide: FetchService,
					useFactory: (loggerService: LoggerService, opts: IFetchOptions) => {
						return new FetchService(loggerService, opts);
					},
					inject: [LoggerService, "options"],
				},
			],
			exports: [FetchService],
		};
	}
}
