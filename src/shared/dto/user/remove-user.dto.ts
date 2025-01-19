import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class RemoveUserParamDTO {
	@Expose()
	@IsString()
	@IsNotEmpty()
	public id!: string;
}

@Exclude()
export class RemoveUserResponseDTO {
	@Expose()
	public affectedRows!: number;
}

@Exclude()
export class RemoveUserDTO extends DTO {
	public static url = "users/:id";
	public readonly method = METHOD.DELETE;
	public paramsDTO: RemoveUserParamDTO;
	public queryDTO = undefined;
	public bodyDTO = undefined;
	public readonly responseDTOClass = RemoveUserResponseDTO;
	public readonly url: string = RemoveUserDTO.url;

	public constructor(paramsDTO: RemoveUserParamDTO) {
		super();
		this.paramsDTO = paramsDTO;
	}
}
