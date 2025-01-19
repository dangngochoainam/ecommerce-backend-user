import { AbstractSQLService } from "src/core/entity/base-sql-service";
import { EntityManager, EntityTarget, FindManyOptions, FindOneOptions, FindOptionsWhere, ObjectLiteral } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

export abstract class CommonAbstractSQLService<E extends ObjectLiteral> extends AbstractSQLService {
	public constructor(
		protected readonly entityManager: EntityManager,
		protected readonly entityClass: EntityTarget<E>,
	) {
		super();
	}

	public async sqlFindOne(
		rootManager: EntityManager = this.entityManager,
		findCondition: FindOneOptions<E>,
	): Promise<E | null> {
		return await rootManager.getRepository(this.entityClass).findOne({
			...findCondition,
			where: {
				...findCondition.where,
			} as FindOptionsWhere<E>,
		});
	}

	public async sqlFind(
		rootManager: EntityManager = this.entityManager,
		findCondition: FindManyOptions<E>,
	): Promise<E[]> {
		return await rootManager.getRepository(this.entityClass).find({
			...findCondition,
			where: {
				...findCondition.where,
			} as FindOptionsWhere<E>,
		});
	}

	public async sqlInsert(rootManager: EntityManager = this.entityManager, dataCreate: E): Promise<Partial<E>> {
		return await this.mergeTransaction(rootManager, async (manager) => {
			const obj = manager.create(this.entityClass, dataCreate);
			const insertResult = await manager.save(obj);
			return {
				id: (insertResult as any).id,
			} as unknown as Partial<E>;
		});
	}

	public async sqlUpdate(
		rootManager: EntityManager = this.entityManager,
		findCondition: FindManyOptions<E>,
		dataUpdate: QueryDeepPartialEntity<E>,
	): Promise<number> {
		return await this.mergeTransaction(rootManager, async (manager) => {
			const updateResult = await manager.getRepository(this.entityClass).update(
				{
					...findCondition.where,
				} as FindOptionsWhere<E>,
				dataUpdate,
			);
			return updateResult.affected ?? 0;
		});
	}

	public async sqlUpsert(
		rootManager: EntityManager = this.entityManager,
		dataCreate: E,
		conflictOptions: string[],
	): Promise<Partial<E>> {
		return await this.mergeTransaction(rootManager, async (manager) => {
			const insertResult = await manager.getRepository(this.entityClass).upsert(dataCreate, conflictOptions);
			return {
				id: String(insertResult.identifiers[0].id),
			} as unknown as Partial<E>;
		});
	}

	public async sqlCount(
		rootManager: EntityManager = this.entityManager,
		findCondition: FindManyOptions<E>,
	): Promise<number> {
		return rootManager.getRepository(this.entityClass).count({
			...findCondition,
			where: {
				...findCondition.where,
			} as FindOptionsWhere<E>,
		});
	}

	public async sqlSoftDelete(
		rootManager: EntityManager = this.entityManager,
		findCondition: FindManyOptions<E>,
	): Promise<number> {
		return await this.mergeTransaction(rootManager, async (manager) => {
			const updateResult = await manager
				.getRepository(this.entityClass)
				.createQueryBuilder()
				.softDelete()
				.where({ ...findCondition.where })
				.execute();
			return updateResult.affected ?? 0;
		});
	}
}
