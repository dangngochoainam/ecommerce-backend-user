import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { AbstractSQLService } from "../../../core/entity/base-sql-service";
import { InjectEntityManager } from "@nestjs/typeorm";
import { CONNECTION_NAME } from "../../typeorm.module";
import { TransientPayloadEntity } from "../../entity/transient-payload.entity";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

type PickPartialPayloadResult<PAYLOAD> = Array<{
	jsonb_build_object?: Partial<PAYLOAD>;
	TransientPayloadEntity_payload?: PAYLOAD;
}>;

export interface IGetWorkflowPayloadParams {
	correlationID: string;
	workflowName: string;
	pickKeys?: never;
}
export interface IGetPartialWorkflowPayloadParams<Payload> extends Omit<IGetWorkflowPayloadParams, "pickKeys"> {
	pickKeys: Array<keyof Payload>;
}

@Injectable()
export class WorkflowPayloadService extends AbstractSQLService {
	constructor(
		@InjectEntityManager(CONNECTION_NAME)
		private defaultManager: EntityManager,
	) {
		super();
	}

	public async sqlUpdateWorkflowPayload(
		manager = this.defaultManager,
		params: {
			workflowName: string;
			correlationID: string;
			payload: unknown;
		},
	) {
		await manager.getRepository(TransientPayloadEntity).update(
			{
				workflowName: params.workflowName,
				correlationID: params.correlationID,
			},
			{
				payload: params.payload,
			} as QueryDeepPartialEntity<TransientPayloadEntity>,
		);
	}

	public async sqlSaveWorkflowPayload(
		manager = this.defaultManager,
		workflowPayloadData: QueryDeepPartialEntity<TransientPayloadEntity>,
	): Promise<void> {
		const workflowPayloadRepo = manager.getRepository(TransientPayloadEntity);
		await workflowPayloadRepo.insert(workflowPayloadData);
	}

	public async sqlGetWorkflowPayload<Payload>(
		manager: EntityManager | undefined,
		params: IGetWorkflowPayloadParams,
	): Promise<Payload | undefined>;
	public async sqlGetWorkflowPayload<Payload>(
		manager: EntityManager | undefined,
		params: IGetPartialWorkflowPayloadParams<Payload>,
	): Promise<Partial<Payload> | undefined>;
	public async sqlGetWorkflowPayload<Payload>(
		manager: EntityManager | undefined,
		params: IGetWorkflowPayloadParams | IGetPartialWorkflowPayloadParams<Payload>,
	): Promise<Payload | Partial<Payload> | undefined>;
	public async sqlGetWorkflowPayload<Payload>(
		manager = this.defaultManager,
		params: IGetWorkflowPayloadParams | IGetPartialWorkflowPayloadParams<Payload>,
	) {
		const workflowPayloadRepo = manager.getRepository(TransientPayloadEntity);
		const queryBuilder = workflowPayloadRepo.createQueryBuilder();
		const pickKeys = params.pickKeys;
		const isPartialPick = Array.isArray(pickKeys) && pickKeys.length > 0;
		if (isPartialPick) {
			const pickScript = pickKeys
				.map((key) => {
					return `'${String(key)}', payload->'${String(key)}'`;
				})
				.join(",");
			queryBuilder.select(`jsonb_build_object(${pickScript})`);
		} else {
			queryBuilder.select();
		}
		const rs = (await queryBuilder
			.where({
				correlationID: params.correlationID,
				workflowName: params.workflowName,
			})
			.limit(1)
			.execute()) as PickPartialPayloadResult<Payload>;
		return Array.isArray(rs) && rs.length > 0
			? isPartialPick
				? rs[0].jsonb_build_object
				: rs[0].TransientPayloadEntity_payload
			: undefined;
	}

	public async sqlDeleteWorkflowPayload(manager = this.defaultManager, correlationId: string) {
		await manager.getRepository(TransientPayloadEntity).delete({
			correlationID: correlationId,
		});
	}

	public async sqlSetWorkflowPayloadKey<PAYLOAD, ADDITIONAL_KEY_DATA>(
		manager = this.defaultManager,
		payloadInfo: IGetWorkflowPayloadParams,
		payloadKey: string,
		payloadData: ADDITIONAL_KEY_DATA,
	): Promise<void> {
		const repo = manager.getRepository(TransientPayloadEntity);
		const existingPayload = await this.sqlGetWorkflowPayload<PAYLOAD>(manager, payloadInfo);
		if (!existingPayload) {
			throw new Error("The workflow payload not existing");
		}
		await repo.update(payloadInfo, {
			payload: {
				...existingPayload,
				[payloadKey]: payloadData,
			},
		});
	}

	public async sqlDeleteWorkflowPayloadKey<PAYLOAD>(
		manager = this.defaultManager,
		payloadInfo: IGetWorkflowPayloadParams,
		payloadKey: keyof PAYLOAD,
	): Promise<void> {
		const repo = manager.getRepository(TransientPayloadEntity);
		const existingPayload = await this.sqlGetWorkflowPayload<PAYLOAD>(manager, payloadInfo);
		if (!existingPayload) {
			throw new Error("The workflow payload not existing");
		}
		delete existingPayload[payloadKey];
		await repo.update(payloadInfo, {
			payload: existingPayload,
		});
	}

	public async sqlGetWorkflowPayloadKey<PAYLOAD>(
		manager = this.defaultManager,
		payloadInfo: IGetWorkflowPayloadParams,
		payloadKey: keyof PAYLOAD,
	): Promise<PAYLOAD[keyof PAYLOAD]> {
		const existingPayload = await this.sqlGetWorkflowPayload<PAYLOAD>(manager, payloadInfo);
		if (!existingPayload) {
			throw new Error("The workflow payload not existing");
		}
		return existingPayload[payloadKey];
	}
}
