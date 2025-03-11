import { Exclude, Expose } from "class-transformer";
import { IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class RegisterRequestBodyDTO {
	@Expose()
	@IsNotEmpty()
	@IsEmail()
	@IsString()
	public email!: string;

	@Expose()
	@IsNotEmpty()
	@IsString()
	public password!: string;

	@Expose()
	@IsNotEmpty()
	@IsString()
	public name!: string;
}

@Exclude()
export class RegisterResponseDTO {
	@Expose()
	@IsBoolean()
	public isSuccess!: boolean;
}

export class RegisterDTO extends DTO {
	public static url = "register";
	public readonly method = METHOD.POST;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: RegisterRequestBodyDTO;

	public readonly responseDTOClass = RegisterResponseDTO;
	public readonly url: string = RegisterDTO.url;

	constructor(bodyDTO: RegisterRequestBodyDTO) {
		super();
		this.bodyDTO = bodyDTO;
	}
}
