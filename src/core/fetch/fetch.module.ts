import { DynamicModule, FactoryProvider, Global, Module } from "@nestjs/common";
import { FETCH_CONFIG_PROVIDER, FetchService, IFetchOptions } from "./fetch.service";
import { FetchController } from "./fetch.controller";

@Global()
@Module({})
export class FetchModule {
	public static register(opts: Omit<FactoryProvider<IFetchOptions>, "provide">): DynamicModule {
		return {
			module: FetchModule,
			imports: [],
			providers: [
				FetchService,
				{
					provide: FETCH_CONFIG_PROVIDER,
					...opts,
				},
			],
			exports: [FetchService, FETCH_CONFIG_PROVIDER],
			controllers: [FetchController],
		};
	}
}
