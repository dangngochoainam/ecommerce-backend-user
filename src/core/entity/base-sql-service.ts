import { EntityManager } from "typeorm";

export type SQLMethodName = `sql${string}`;

export abstract class AbstractSQLService {
	[K: SQLMethodName]: (manager?: EntityManager, ...arg: never[]) => unknown;

	protected async mergeTransaction<T>(
		manager: EntityManager,
		runInTransaction: (manager: EntityManager) => Promise<T>,
	) {
		if (manager.queryRunner?.isTransactionActive) {
			return runInTransaction(manager);
		}
		return manager.transaction(runInTransaction);
	}
}
