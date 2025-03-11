import {Exclude, Expose} from "class-transformer";
import {IsNotEmpty, IsString} from "class-validator";
import {DTO, METHOD} from "../base.dto";

@Exclude()
export class EncryptionRequestBodyDTO {
    @Expose()
    @IsString()
    @IsNotEmpty()
    public data!: string;
}

@Exclude()
export class EncryptionResponseDTO {
    @Expose()
    @IsString()
    public data!: string;
}

export class EncryptionDto extends DTO {
    public static url = "crypto/encryption";
    public readonly method = METHOD.POST;

    public paramsDTO: undefined;
    public queryDTO: undefined;
    public bodyDTO: EncryptionRequestBodyDTO;

    public readonly responseDTOClass = EncryptionResponseDTO;
    public readonly url: string = EncryptionDto.url;

    constructor(body: EncryptionRequestBodyDTO) {
        super();
        this.bodyDTO = body;
    }
}
