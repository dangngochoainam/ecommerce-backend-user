import { Exclude, Expose } from "class-transformer";
import { IsString } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class TestResponseDTO {
	@Expose()
	@IsString()
	public data!: string;
}

export class TestDto extends DTO {
	public static url = "";
	public readonly method = METHOD.GET;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: undefined;

	public readonly responseDTOClass = TestResponseDTO;
	public readonly url: string = TestDto.url;

	constructor() {
		super();
	}
}
