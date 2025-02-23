import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { ContextLogger, LoggerService } from "../logger/logger.service";

export interface ICryptoKey {
	publicKey: string;
	privateKey: string;
}

export const CRYPTO_KEY_GETTER_PROVIDER = Symbol("CRYPTO_KEY_GETTER_PROVIDER");

@Injectable()
export class CryptoService implements OnApplicationBootstrap {
	protected logger!: ContextLogger;

	public constructor(
		protected loggerService: LoggerService,
		@Inject(CRYPTO_KEY_GETTER_PROVIDER) private cryptoKey: ICryptoKey,
	) {
		this.logger = this.loggerService.newContextLogger(this.constructor.name);
	}
	private AES: string = "aes-256-cbc";
	private publicKey!: string;
	private privateKey!: string;

	public async encrypt(plainText: string, type: string): Promise<string> {
		if (type === "aes") return this.encryptAES(Buffer.from(plainText, "utf-8"), "password here").toString("base64");
		if (type === "rsa") return this.encryptRSA(Buffer.from(plainText, "utf-8")).toString("base64");
		return "";
	}

	public async decrypt(encryptedData: string, password: string = "password here", type: string): Promise<string> {
		console.log(password);
		if (type === "aes") return this.decryptAES(Buffer.from(encryptedData, "base64"), password).toString();
		if (type === "rsa") return this.decryptRSA(Buffer.from(encryptedData, "base64")).toString();
		return "";
	}

	public async hashPassword(password: string): Promise<string> {
		return await bcrypt.hash(password, 12);
	}

	public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	// AES
	public encryptAES(buffer: Buffer, password: string): Buffer {
		// Generate a random salt
		const salt = crypto.randomBytes(16);

		// Derive the same key using PBKDF2
		const key = crypto.pbkdf2Sync(password, salt, 151164, 32, "sha256");

		// Generate a random IV
		const iv = crypto.randomBytes(16);

		const cipher = crypto.createCipheriv(this.AES, key, iv);
		const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);

		// Store salt and IV with the encrypted data
		return Buffer.concat([salt, iv, encryptedData]);
	}

	public decryptAES(encryptedBuffer: Buffer, password: string): Buffer {
		// Extract salt, IV, and encrypted data
		const salt = encryptedBuffer.subarray(0, 16);
		const iv = encryptedBuffer.subarray(16, 32);
		const encryptedData = encryptedBuffer.subarray(32);

		// Derive the same key using PBKDF2
		const key = crypto.pbkdf2Sync(password, salt, 151164, 32, "sha256");

		// Create decipher with the same algorithm, key, and IV
		const decipher = crypto.createDecipheriv(this.AES, key, iv);

		// Decrypt the data
		const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

		return decrypted;
	}

	// RSA
	public getRSAKeyPair() {
		return {
			privateKey: this.privateKey,
			publicKey: this.publicKey,
		};
	}

	public encryptRSA(buffer: Buffer): Buffer {
		const publicKey = this.getRSAKeyPair().publicKey;
		return crypto.publicEncrypt(
			{
				key: publicKey,
				padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
			},
			buffer,
		);
	}

	public decryptRSA(buffer: Buffer): Buffer {
		const privateKey = this.getRSAKeyPair().privateKey;
		return crypto.privateDecrypt(
			{
				key: privateKey,
				padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
			},
			buffer,
		);
	}

	public onApplicationBootstrap() {
		// const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
		// 	modulusLength: 2048, // Key size (2048 or 4096 recommended)
		// 	publicKeyEncoding: { type: "spki", format: "pem" },
		// 	privateKeyEncoding: { type: "pkcs8", format: "pem" },
		// });

		this.publicKey = this.cryptoKey.publicKey;
		this.privateKey = this.cryptoKey.privateKey;
	}
}
