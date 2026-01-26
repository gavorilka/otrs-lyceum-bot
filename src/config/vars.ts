import dotenv from "dotenv";

dotenv.config();

export const botToken: string = process.env.BOT_TOKEN || '';
export const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const otrsBaseUrl: string = process.env.OTRS_BASE_URL || '';