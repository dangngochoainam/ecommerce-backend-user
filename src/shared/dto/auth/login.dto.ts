import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class LoginBodyDTO {
	@Expose()
	@IsString()
	@IsNotEmpty()
	public email!: string;

	@Expose()
	@IsString()
	@IsNotEmpty()
	public password!: string;
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
