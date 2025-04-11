import { Module } from "@nestjs/common";
import { TriggerConjobController } from "./trigger-cronjob.controller";

@Module({
	controllers: [TriggerConjobController],
})
export class TriggerCronjobModule {}
