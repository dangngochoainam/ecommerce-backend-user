import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WorkflowErrorEntity } from "src/db-workflow/entity/workflow-error.entity";
import { WorkflowEntity } from "../../entity/workflow.entity";
import { DATA_PLANE_CONNECTION_NAME } from "../../typeorm.module";
import { WorkflowCoreSQLService } from "./workflow-core.service";
import { WorkflowErrorService } from "./workflow-error.service";

@Module({
	imports: [TypeOrmModule.forFeature([WorkflowEntity, WorkflowErrorEntity], DATA_PLANE_CONNECTION_NAME)],
	providers: [
		WorkflowCoreSQLService,
		WorkflowErrorService,
	],
	exports: [ WorkflowCoreSQLService, WorkflowErrorService],
})
export class WorkflowCoreSQLModule {}
