import { Injectable } from "@nestjs/common";
import { EntityManager, In } from "typeorm";
import { AbstractSQLService } from "../../../core/entity/base-sql-service";
import { InjectEntityManager } from "@nestjs/typeorm";
import { DATA_PLANE_CONNECTION_NAME } from "../../typeorm.module";
import { WorkflowErrorEntity } from "../../entity/workflow-error.entity";
import { FindOptionsWhere } from "typeorm";

@Injectable()
export class WorkflowErrorService extends AbstractSQLService {
	public constructor(
		@InjectEntityManager(DATA_PLANE_CONNECTION_NAME)
		private defaultManager: EntityManager,
	) {
		super();
	}

	public async sqlGetWorkflowError(
		manager = this.defaultManager,
		params: {
			workflowId: string
		},
	): Promise<WorkflowErrorEntity | null> {
		return manager.getRepository(WorkflowErrorEntity).findOne({
			where: {
				workflowId: params.workflowId
			}
		})
	}

	public async sqlSaveWorkflowError(
		manager = this.defaultManager,
		workflowPayloadData: Partial<WorkflowErrorEntity>,
	): Promise<void> {
		await manager.getRepository(WorkflowErrorEntity).upsert(
			workflowPayloadData,
			["workflowId"]
		);
	}

	public async sqlDeleteWorkflowError(
		manager = this.defaultManager,
		correlationId: string,
	): Promise<void> {
		await manager.getRepository(WorkflowErrorEntity).delete({
			correlationID: correlationId,
		});
	}

	public async sqlGetWorkflowErrors(
		manager = this.defaultManager,
		params: {
			workflowIds?: string[];
			correlationIds?: string[];
		},
	): Promise<WorkflowErrorEntity[]> {
		const findConditions: FindOptionsWhere<WorkflowErrorEntity> = {
			...(params.correlationIds?.length ? {
				correlationID: In(params.correlationIds),
			} : {}),
			...(params.workflowIds?.length ? {
				workflowId: In(params.workflowIds)
			} : {})
		}
		if (Object.keys(findConditions).length === 0) {
			return [];
		}
		return manager.getRepository(WorkflowErrorEntity).find({
			where: findConditions,
		});
	}
}
