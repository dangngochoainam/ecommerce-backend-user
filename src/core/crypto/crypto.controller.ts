import { Body, Controller, Post } from "@nestjs/common";
import { CryptoService } from "./crypto.service";
import { NON_ENCRYPTION } from "./crypto.decorator";

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

	@Post("/crypto/encryption")
	public async encryption(@Body() body: { encryptedData: string }): Promise<any> {
		return body;
	}

	@NON_ENCRYPTION
	@Post("/crypto/non-encryption")
	public async nonEncryption(
		@Body() body: { password: string; data: any },
	): Promise<{ encryptedPassword: string; encryptedData: string }> {
		return {
			encryptedPassword: this.cryptoService.encryptRSA(Buffer.from(body.password, "utf-8")).toString("base64"),
			encryptedData: this.cryptoService
				.encryptAES(Buffer.from(JSON.stringify(body.data), "utf-8"), body.password)
				.toString("base64"),
		};
	}
}
