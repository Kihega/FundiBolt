import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { checkDbConnection } from "./config/prisma";
import { checkRedisConnection } from "./config/redis";
import authRoutes from "./routes/auth.routes";
import otpRoutes from "./routes/otp.routes";

export const app = express();

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

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
