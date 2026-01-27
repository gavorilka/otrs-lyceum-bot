import "reflect-metadata";
import { DataSource } from "typeorm";
import {dbHost, dbName, dbPassword, dbPort, dbUser, env} from "../config/vars";

export default new DataSource({
    type: "postgres",
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPassword,
    database: dbName,
    synchronize: env !== "production", // true ⚠️только для dev
    entities: [
        env === "production"
        ? "dist/db/entities/*.js"
        : "src/db/entities/*.ts"
    ],
    migrations: [
        env === "production"
            ? "dist/db/migrations/*.js"
            : "src/db/migrations/*.ts"
    ],
});

