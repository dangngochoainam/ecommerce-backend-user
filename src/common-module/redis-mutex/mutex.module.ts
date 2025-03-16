import { Module } from "@nestjs/common";
import { MutexService, RedisMutexService } from "./mutex.service";
import { MutexController } from "./mutex.controller";

@Module({
	imports: [],
	providers: [MutexService, RedisMutexService],
	exports: [MutexService],
	controllers: [MutexController],
})
export class MutexModule {}
