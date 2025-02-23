import { Body, Controller, Post } from "@nestjs/common";
import { CryptoService } from "./crypto.service";

@Controller()
export class CryptoController {
	public constructor(private readonly cryptoService: CryptoService) {}

	@Post("/crypto/encrypt")
	public async encryptAES(@Body() body: { plainText: string; type: string }): Promise<string> {
		return this.cryptoService.encrypt(body.plainText, body.type);
	}

	@Post("/crypto/decrypt")
	public async decryptAES(@Body() body: { encryptedData: string; password?: string; type: string }): Promise<string> {
		return this.cryptoService.decrypt(body.encryptedData, body.password, body.type);
	}

	@Post("/crypto/public-key")
	public async getPublicKey(): Promise<string> {
		return this.cryptoService.getRSAKeyPair().publicKey;
	}
}
