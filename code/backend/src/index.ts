import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { checkDbConnection } from "./config/db";
import { checkRedisConnection } from "./config/redis";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  const dbOk = await checkDbConnection();
  const redisOk = await checkRedisConnection();

  const healthy = dbOk && redisOk;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    database: dbOk ? "connected" : "unreachable",
    redis: redisOk ? "connected" : "unreachable",
    env: env.nodeEnv,
  });
});

app.get("/", (_req, res) => {
  res.json({ message: "FundiBolt API is running" });
});

app.listen(env.port, () => {
  console.log(`FundiBolt backend listening on port ${env.port}`);
});
