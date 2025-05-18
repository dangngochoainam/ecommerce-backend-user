import { InjectEntityManager } from "@nestjs/typeorm";
import { AbstractSQLService } from "src/core/entity/base-sql-service";
import { CoreEnvironment, CoreEnvironmentService } from "src/core/environment/environment.service";
import { mirrorAndFilter } from "src/core/utils/transformer";
import { WorkflowEntity } from "src/db-workflow/entity/workflow.entity";
import { FINAL_WORKFLOW_STATUS, WORKFLOW_STATUS } from "src/core/workflow/workflow-type";
import { EntityManager, In, Not } from "typeorm";
import { DATA_PLANE_CONNECTION_NAME } from "../../typeorm.module";
import { InternalServerErrorException } from "@nestjs/common";

export class WorkflowCoreSQLService extends AbstractSQLService {
	public constructor(
		@InjectEntityManager(DATA_PLANE_CONNECTION_NAME)
		public readonly defaultManager: EntityManager,
		private envService: CoreEnvironmentService<CoreEnvironment>,
	) {
		super();
	}

	public async sqlGetWorkflowByID(
		manager: EntityManager | undefined = this.defaultManager,
		params: {
			workflowId: string;
			finished?: boolean;
			correlationId?: string;
			paused?: boolean;
		},
	) {
		return manager.getRepository(WorkflowEntity).findOne({
			where: {
				version: "v1",
				id: params.workflowId,
			},
		});
	}

	public async sqlGetPendingWorkflowItem(
		m: EntityManager | undefined = this.defaultManager,
		params: {
			workflowName: string;
			gapMinute?: number;
		},
	): Promise<WorkflowEntity[]> {
		return m.getRepository(WorkflowEntity).find({
			where: {
				workflowName: params.workflowName,
				finished: Not(true),
				status: Not(In(FINAL_WORKFLOW_STATUS)),
			},
		});
	}

	public async sqlMarkAsPendingReset(
		m: EntityManager | undefined = this.defaultManager,
		params: {
			correlationIds: string[];
			workflowName: string;
		},
	) {
		return await m.getRepository(WorkflowEntity).update(
			{
				correlationId: In(params.correlationIds),
				workflowName: params.workflowName,
			},
			{
				pendingReset: true,
			},
		);
	}

	public async sqlResetCompletedWorkflow(
		m: EntityManager | undefined = this.defaultManager,
		params: {
			workflowName: string;
			correlationId?: string;
			maxAttempt?: number;
		},
	) {
		return m.getRepository(WorkflowEntity).update(
			{
				workflowName: params.workflowName,
				status: In(FINAL_WORKFLOW_STATUS),
				...(params.correlationId
					? {
							correlationId: params.correlationId,
						}
					: {
							pendingReset: true,
						}),
			},
			{
				pendingReset: false,
				currentAttempt: 0,
				status: WORKFLOW_STATUS.NEW,
				finished: false,
				cycle: () => "cycle + 1",
				...(params.maxAttempt
					? {
							maxAttempt: params.maxAttempt,
						}
					: {}),
			},
		);
	}

	public async sqlGetWorkflowByCorrelationId(
		manager: EntityManager | undefined = this.defaultManager,
		params: {
			correlationID: string;
			workflowName: string[];
			status?: WORKFLOW_STATUS;
		},
	) {
		return manager.getRepository(WorkflowEntity).find({
			where: {
				version: "v1",
				...(params.status
					? {
							status: params.status,
						}
					: {}),
				correlationId: params.correlationID,
				workflowName: In(params.workflowName),
			},
			take: params.workflowName.length,
		});
	}

	public async sqlUpdateWfStatus<T extends WORKFLOW_STATUS>(
		m: EntityManager | undefined = this.defaultManager,
		params: {
			workflowId: string;
			status?: T;
		},
	) {
		await m.getRepository(WorkflowEntity).update(
			{
				id: params.workflowId,
				status: Not(In(FINAL_WORKFLOW_STATUS)),
			},
			{
				...(params.status
					? {
							status: params.status,
							finished: FINAL_WORKFLOW_STATUS.includes(params.status),
						}
					: {}),
				lastModifiedAt: new Date(),
			},
		);
	}

	public async sqlNewWorkflowItem(
		m: EntityManager | undefined = this.defaultManager,
		params: Pick<WorkflowEntity, "correlationId" | "workflowName" | "maxAttempt">,
	) {
		return this.mergeTransaction(m, async (transactionManager) => {
			const repo = transactionManager.getRepository(WorkflowEntity);
			const p = mirrorAndFilter(params, undefined, []);
			const correlationId = params.correlationId as string;

			const existing = await repo.findOne({
				where: {
					correlationId,
					workflowName: params.workflowName,
				},
			});
			if (existing) {
				if (!FINAL_WORKFLOW_STATUS.includes(existing.status)) {
					throw new InternalServerErrorException("Workflow already processing");
				}
				await this.sqlResetCompletedWorkflow(m, {
					workflowName: existing.workflowName,
					correlationId: existing.correlationId,
				});
				return m.getRepository(WorkflowEntity).findOne({
					where: {
						correlationId,
					},
				});
			}

			const res = await m.getRepository(WorkflowEntity).insert({
				...p,
				serviceName: this.envService.ENVIRONMENT.MICROSERVICES,
				version: "v1",
				currentAttempt: 0,
				status: WORKFLOW_STATUS.NEW,
				finished: false,
				cycle: 1,
			});
			return m.getRepository(WorkflowEntity).findOne({
				where: {
					id: res.identifiers[0].id,
				},
			});
		});
	}

	public async sqlIncreaseAttempt(
		m: EntityManager | undefined = this.defaultManager,
		params: {
			workflowId: string;
		},
	) {
		const res = await m.getRepository(WorkflowEntity).increment(
			{
				id: params.workflowId,
			},
			"currentAttempt",
			1,
		);
		return (res.raw as { currentAttempt: number }).currentAttempt;
	}

	public async sqlGetWorkflowByCorrelationIds(
		manager: EntityManager | undefined = this.defaultManager,
		params: {
			correlationID: string[];
			workflowName: string[];
			status?: WORKFLOW_STATUS;
		},
	): Promise<[WorkflowEntity[], number]> {
		return manager.getRepository(WorkflowEntity).findAndCount({
			where: {
				version: "v1",
				...(params.status
					? {
							status: params.status,
						}
					: {}),
				correlationId: In(params.correlationID),
				workflowName: In(params.workflowName),
			},
		});
	}
}
