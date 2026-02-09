import express from "express";
import bot from "./bot";
import {appPort} from "./config/vars";
import db from "./db/db";

const app = express();

// health-check endpoint
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
  bot.api.sendMessage(580852515, "✅ Health check passed"
  )
});

async function bootstrap() {
  try {
    await db.initialize();
    console.log("📦 Database connected");

    console.log(
        db.entityMetadatas.map(m => m.name)
    );

    app.listen(appPort, () => {
      console.log(`Server running on http://localhost:${appPort}`);
    });

    bot.start({onStart: async () => console.log("🤖 Bot started")});
  } catch (err) {
    console.error("❌ Startup error", err);
    process.exit(1);
  }
}

bootstrap()
