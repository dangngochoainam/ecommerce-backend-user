import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";

export const CONNECTION_NAME = "transit";

export const typeormOptions = <TypeOrmModuleOptions>{
	name: CONNECTION_NAME,
	type: "postgres",
	entities: [join(__dirname, "/entity/**.entity{.ts,.js}")],
	keepConnectionAlive: true,
	maxQueryExecutionTime: 500,
	extra: {
		connectionLimit: 10,
	},
};