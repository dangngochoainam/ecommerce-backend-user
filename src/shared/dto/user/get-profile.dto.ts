import { Exclude, Expose } from "class-transformer";
import { DTO, METHOD } from "../base.dto";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
export class GetProfileParamDTO {
	@Expose()
	@IsString()
	@IsNotEmpty()
	public id!: string;
}
@Exclude()
export class GetProfileResponseDTO {
	@Expose()
	public id!: string;

	@Expose()
	public email!: string;

	@Expose()
	public password!: string;
}

@Exclude()
export class GetProfileDTO extends DTO {
	public static url = "users/:id";
	public readonly method = METHOD.GET;
	public paramsDTO: GetProfileParamDTO;
	public queryDTO: undefined;
	public bodyDTO: undefined;
	public readonly responseDTOClass = GetProfileResponseDTO;
	public readonly url: string = GetProfileDTO.url;

	public constructor(paramsDTO: GetProfileParamDTO) {
		super();
		this.paramsDTO = paramsDTO;
	}
}
