import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseSqlLoggerService } from "src/core/logger/sql-logger.service";
import { LogEntity } from "src/db-log/entity/log.entity";
import { Repository } from "typeorm";
import { SQL_LOG_DB_CONNECTION_NAME } from "./db-logger";

@Injectable()
export class SqlLoggerService extends BaseSqlLoggerService {
	constructor(
		@InjectRepository(LogEntity, SQL_LOG_DB_CONNECTION_NAME) private readonly logRepository: Repository<LogEntity>,
	) {
		super();
	}

	public insertLog(payload: LogEntity): void {
		this.logRepository
			.insert(payload)
			.then((_) => {})
			.catch((error) => console.error("INSERT LOG ERROR: ", error));
	}
}
