import { Exclude, Expose } from "class-transformer";
import { IsString } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class LoginBodyDTO {
	@Expose()
	@IsString()
	public userId!: string;
}

@Exclude()
export class LoginResponseDTO {
	@Expose()
	@IsString()
	public token!: string;
}

export class LoginDto extends DTO {
	public static url = "login";
	public readonly method = METHOD.POST;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: LoginBodyDTO;

	public readonly responseDTOClass = LoginResponseDTO;
	public readonly url: string = LoginDto.url;

	constructor(bodyDTO: LoginBodyDTO) {
		super();
		this.bodyDTO = bodyDTO;
	}
}
