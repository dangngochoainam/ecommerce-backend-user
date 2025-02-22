import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class RenewTokenBodyDTO {
	@Expose()
	@IsString()
	@IsNotEmpty()
	public token!: string;
}

@Exclude()
export class RenewTokenResponseDTO {
	@Expose()
	@IsString()
	@IsNotEmpty()
	public token!: string;
}

export class RenewTokenDto extends DTO {
	public static url = "renew-token";
	public readonly method = METHOD.POST;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: RenewTokenBodyDTO;

	public readonly responseDTOClass = RenewTokenResponseDTO;
	public readonly url: string = RenewTokenDto.url;

	constructor(bodyDTO: RenewTokenBodyDTO) {
		super();
		this.bodyDTO = bodyDTO;
	}
}
