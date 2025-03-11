import { DynamicModule, FactoryProvider, Global, Module } from "@nestjs/common";
import { CryptoController } from "./crypto.controller";
import { CRYPTO_KEY_GETTER_PROVIDER, CryptoService, ICryptoKey } from "./crypto.service";
import { FetchModule } from "../fetch/fetch.module";

@Global()
@Module({})
export class CryptoModule {
	public static register(options: Omit<FactoryProvider<ICryptoKey>, "provide">): DynamicModule {
		return {
			imports: [FetchModule],
			module: CryptoModule,
			providers: [
				CryptoService,
				{
					provide: CRYPTO_KEY_GETTER_PROVIDER,
					...options,
				},
			],
			controllers: [CryptoController],
			exports: [CryptoService],
		};
	}
}
