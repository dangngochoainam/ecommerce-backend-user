import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";

export const DATA_PLANE_CONNECTION_NAME = "workflow";

export const typeormOptions = <TypeOrmModuleOptions>{
	name: DATA_PLANE_CONNECTION_NAME,
	type: "postgres",
	entities: [join(__dirname, "/entity/**.entity{.ts,.js}")],
	keepConnectionAlive: true,
	maxQueryExecutionTime: 500,
	extra: {
		connectionLimit: 10,
	},
};
