import {
	Body,
	Controller,
	Delete,
	FileTypeValidator,
	Get,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Put,
	Query,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { allowFileTypes, maxFileSize } from "src/shared/constants/file.constant";
import { GetProfileDTO, GetProfileParamDTO, GetProfileResponseDTO } from "src/shared/dto/user/get-profile.dto";
import { GetUserListDTO, GetUserListQueryDTO, GetUserListResponseDTO } from "src/shared/dto/user/get-user-list.dto";
import { RemoveUserDTO, RemoveUserParamDTO, RemoveUserResponseDTO } from "src/shared/dto/user/remove-user.dto";
import {
	UpdateProfileBodyDTO,
	UpdateProfileDTO,
	UpdateProfileParamDTO,
	UpdateProfileResponseDTO,
} from "src/shared/dto/user/update-profile.dto";
import { UserService } from "./user.service";

@Controller()
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(GetUserListDTO.url)
	public async getListUser(@Query() query: GetUserListQueryDTO): Promise<GetUserListResponseDTO> {
		return this.userService.getUserList(query);
	}

	@Get(GetProfileDTO.url)
	public async getProfile(@Param() params: GetProfileParamDTO): Promise<GetProfileResponseDTO> {
		return this.userService.getProfile(params);
	}

	@UseInterceptors(FileInterceptor("file"))
	@Put(UpdateProfileDTO.url)
	public async updateProfile(
		@UploadedFile(
			new ParseFilePipe({
				fileIsRequired: false,
				validators: [
					new FileTypeValidator({ fileType: allowFileTypes }),
					new MaxFileSizeValidator({ maxSize: maxFileSize }),
				],
			}),
		)
		file: Express.Multer.File,
		@Param() params: UpdateProfileParamDTO,
		@Body() body: UpdateProfileBodyDTO,
	): Promise<UpdateProfileResponseDTO> {
		return this.userService.updateProfile(params, body, file);
	}

	@Delete(RemoveUserDTO.url)
	public async removeUser(@Param() params: RemoveUserParamDTO): Promise<RemoveUserResponseDTO> {
		return this.userService.removeUser(params);
	}
}
