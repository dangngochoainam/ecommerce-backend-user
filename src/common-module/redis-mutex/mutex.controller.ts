import { Body, Controller, Post } from "@nestjs/common";
import { MutexService } from "./mutex.service";
import { NON_ENCRYPTION } from "src/core/crypto/crypto.decorator";

@Controller()
export class MutexController {
	public constructor(private readonly mutexService: MutexService) {}

	@Post("test-mutex")
	@NON_ENCRYPTION
	public async testMutex(@Body() body: { key: string; timeout: number; handleTime: number }) {
		return this.mutexService.testMutex(body.key, body.timeout, body.handleTime);
	}
}
