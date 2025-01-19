import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";

export const CONNECTION_NAME = "user";

export const typeOrmOptions: TypeOrmModuleOptions = {
	name: CONNECTION_NAME,
	type: "postgres",
	entities: [join(__dirname, "/entity/**.entity{.ts,.js}")],
	logging: false,
	synchronize: false,
	keepConnectionAlive: true,
	extra: {
		connectionLimit: 10,
	},
};
