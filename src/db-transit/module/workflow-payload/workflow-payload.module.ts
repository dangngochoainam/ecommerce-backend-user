import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransientPayloadEntity } from "../../entity/transient-payload.entity";
import { WorkflowPayloadService } from "./workflow-payload.service";
import { CONNECTION_NAME } from "../../typeorm.module";

@Module({
	imports: [
		TypeOrmModule.forFeature([TransientPayloadEntity], CONNECTION_NAME),
	],
	providers: [WorkflowPayloadService],
	exports: [WorkflowPayloadService],
})
export class WorkflowPayloadModule {}
