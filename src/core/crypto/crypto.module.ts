import { DynamicModule, FactoryProvider, Module } from "@nestjs/common";
import { CRYPTO_KEY_GETTER_PROVIDER, CryptoService, ICryptoKey } from "./crypto.service";
import { CryptoController } from "./crypto.controller";

@Module({})
export class CryptoModule {
	public static register(options: Omit<FactoryProvider<ICryptoKey>, "provide">): DynamicModule {
		return {
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
