import { Exclude, Expose } from "class-transformer";
import { IsBoolean } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class LogoutResponseDTO {
	@Expose()
	@IsBoolean()
	public isSuccess!: boolean;
}

export class LogoutDTO extends DTO {
	public static url = "logout";
	public readonly method = METHOD.POST;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: undefined;

	public readonly responseDTOClass = LogoutResponseDTO;
	public readonly url: string = LogoutDTO.url;

	constructor() {
		super();
	}
}
