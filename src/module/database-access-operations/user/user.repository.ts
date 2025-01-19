import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { User } from "src/db-user/entity/user.entity";
import { CommonAbstractSQLService } from "src/db-user/sql-service/common-abstract-sql-service";
import { CONNECTION_NAME } from "src/db-user/typeorm.module";
import { EntityManager, FindOptionsWhere } from "typeorm";
import { FindManyOptions } from "typeorm/find-options/FindManyOptions";

@Injectable()
export class UserRepository extends CommonAbstractSQLService<User> {
	public constructor(@InjectEntityManager(CONNECTION_NAME) public readonly defaultManager: EntityManager) {
		super(defaultManager, User);
	}

	public async findAndCount(
		rootManager: EntityManager = this.entityManager,
		findCondition: FindManyOptions<User>,
	): Promise<[User[], number]> {
		return rootManager.getRepository(this.entityClass).findAndCount({
			...findCondition,
			where: {
				...findCondition.where,
			} as FindOptionsWhere<User>,
		});
	}
}
