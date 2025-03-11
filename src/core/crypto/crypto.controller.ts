import {Body, Controller, Post, SetMetadata} from "@nestjs/common";
import {CryptoService} from "./crypto.service";
import {NON_ENCRYPTION} from "./crypto.decorator";
import {EncryptionDto, EncryptionRequestBodyDTO} from "src/shared/dto/crypto/test.dto";
import {HEADER} from "src/shared/constants/http.constant";
import {instanceToPlain} from "class-transformer";
import {CONTENT_TYPE} from "../../shared/enums/http";

@Controller()
export class CryptoController {
    public constructor(
        private readonly cryptoService: CryptoService,
    ) {
    }

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

    @Post(EncryptionDto.url)
    @SetMetadata('bodyDto', EncryptionRequestBodyDTO)
    public async encryption(@Body() body: EncryptionRequestBodyDTO): Promise<any> {
        body.data = `Data handled: ${body.data}`
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

    @NON_ENCRYPTION
    @Post("/crypto/flow")
    public async flow(@Body() body: { password: string; data: any }) {
        // Simulate Flow FE
        const encryptedPassword = this.cryptoService.encryptRSA(Buffer.from(body.password, "utf-8")).toString("base64");

        const requestBody = new EncryptionRequestBodyDTO();
        requestBody.data = body.data;
        const dto = new EncryptionDto(requestBody);
        const encryptedData = this.cryptoService
            .encryptAES(Buffer.from(JSON.stringify(instanceToPlain(dto.bodyDTO, {excludeExtraneousValues: true}))), body.password)

        const url = `http://localhost:9000/api/v1/${dto.interpolatedUrl}`;
        const response = await fetch(url, {
            body: JSON.stringify({data: encryptedData.toString("base64")}),
            method: dto.method,
            headers: new Headers({
                "Content-Type": CONTENT_TYPE.APPLICATION_JSON,
                [HEADER.ENCRYPTION_KEY]: encryptedPassword
            }),
        });

        // Simulate FE decrypt data from server
        const responseData = await response.json();
        if (!response.ok) {
            return responseData;
        }
        let data = this.cryptoService.decryptAES(Buffer.from(responseData.data, "base64"), body.password)
        return JSON.parse(data.toString("utf-8"))
    }
}
