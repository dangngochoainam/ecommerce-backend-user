import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { TestDto } from "./shared/dto/test/test.dto";

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get(TestDto.url)
	public async getHello(): Promise<string> {
		return this.appService.getHello();
	}
}
