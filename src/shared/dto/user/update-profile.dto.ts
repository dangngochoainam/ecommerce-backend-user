import { Exclude, Expose } from "class-transformer";
import { DTO, METHOD } from "../base.dto";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
export class UpdateProfileParamDTO {
	@Expose()
	@IsString()
	@IsNotEmpty()
	public id!: string;
}

@Exclude()
export class UpdateProfileBodyDTO {
	@Expose()
	@IsString()
	public password?: string;
}
@Exclude()
export class UpdateProfileResponseDTO {
	@Expose()
	public affectedRows!: number;
}

@Exclude()
export class UpdateProfileDTO extends DTO {
	public static url = "users/:id";
	public readonly method = METHOD.PUT;
	public paramsDTO: UpdateProfileParamDTO;
	public queryDTO = undefined;
	public bodyDTO: UpdateProfileResponseDTO;
	public readonly responseDTOClass = UpdateProfileResponseDTO;
	public readonly url: string = UpdateProfileDTO.url;

	public constructor(paramsDTO: UpdateProfileParamDTO, bodyDTO: UpdateProfileResponseDTO) {
		super();
		this.paramsDTO = paramsDTO;
		this.bodyDTO = bodyDTO;
	}
}
