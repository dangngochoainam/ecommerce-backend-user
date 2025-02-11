import {CONNECTION_NAME} from "../typeorm.module";
import {DataSource} from "typeorm";

import dotenv from "dotenv";

dotenv.config();

const AppDataSource = new DataSource({
    name: CONNECTION_NAME,
    type: 'postgres',
    host: process.env.DB_USER_HOST,
    port: Number(process.env.DB_USER_PORT),
    username: process.env.DB_USER_USERNAME,
    password: process.env.DB_USER_PASSWORD,
    database: process.env.DB_USER_DATABASE,
    schema: process.env.DB_USER_SCHEMA,
    entities: ['dist/db-user/entity/**.entity{.ts,.js}'],
    migrations: ['src/db-user/migrations/*-*{.ts,.js}'],
    logging: true,
});

export default AppDataSource;
