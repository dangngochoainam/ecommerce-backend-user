import { DynamicModule, Global, Module, Type } from "@nestjs/common";
import { WorkflowHelperService } from "./workflow-helper.service";
import { AmqpModule } from "../amqp/amqp.module";

@Global()
@Module({})
export class WorkflowModule {
	public static create(params: { workflowSQLModule: Type<any>; workflowPayloadSQLModule: Type<any> }): DynamicModule {
		return {
			imports: [params.workflowSQLModule, params.workflowPayloadSQLModule, AmqpModule],
			providers: [WorkflowHelperService],
			exports: [params.workflowSQLModule, params.workflowPayloadSQLModule, WorkflowHelperService, AmqpModule],
			module: WorkflowModule,
			global: true,
		};
	}
}
