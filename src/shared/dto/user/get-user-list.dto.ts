import { Exclude, Expose } from "class-transformer";
import { PagingRequestDTO, PagingResponseDTO } from "../paging.dto";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class GetUserListQueryDTO extends PagingRequestDTO {
	@Expose()
	@IsString()
	@IsOptional()
	public email?: string;
}

@Exclude()
export class UserItemDTO {
	@Expose()
	@IsNotEmpty()
	@IsString()
	public email!: string;
}

@Exclude()
export class GetUserListResponseDTO extends PagingResponseDTO<UserItemDTO> {}

@Exclude()
export class GetUserListDTO extends DTO {
	public static url = "users";
	public readonly method = METHOD.GET;
	public paramsDTO = undefined;
	public queryDTO: GetUserListQueryDTO;
	public bodyDTO = undefined;
	public readonly responseDTOClass = GetUserListResponseDTO;
	public readonly url: string = GetUserListDTO.url;

	public constructor(queryDTO: GetUserListQueryDTO) {
		super();
		this.queryDTO = queryDTO;
	}
}
