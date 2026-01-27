import dotenv from "dotenv";

dotenv.config();

export const env = process.env.NODE_ENV || "development";

export const botToken: string = process.env.BOT_TOKEN || '';
export const appPort: number = process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 3000;
export const otrsBaseUrl: string = process.env.OTRS_BASE_URL || '';

export const dbHost: string = process.env.DB_HOST || "localhost";
export const dbPort: number = process.env.DB_PORT ?  Number(process.env.DB_PORT) : 5432;
export const dbUser: string = process.env.DB_USER || "postgres";
export const dbPassword: string = process.env.DB_PASSWORD || "postgres";
export const dbName: string = process.env.DB_NAME || "otrs_lyceum_bot";