import express from "express";
import bot from "./bot";
import {port} from "./config/vars";

const app = express();

// health-check endpoint
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Запускаем бота
bot.start();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
