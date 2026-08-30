import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { checkDbConnection } from "./config/prisma";
import { checkRedisConnection } from "./config/redis";
import authRoutes from "./routes/auth.routes";
import otpRoutes from "./routes/otp.routes";

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

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);

async function start() {
  console.log("\nStarting FundiBolt backend...\n");

  const dbOk = await checkDbConnection();
  console.log(dbOk ? "  [OK] Database connected (Supabase/Postgres via Prisma)" : "  [FAIL] Database connection failed");

  const redisOk = await checkRedisConnection();
  console.log(redisOk ? "  [OK] Redis connected (Upstash)" : "  [FAIL] Redis connection failed");

  if (env.resendApiKey) {
    console.log("  [OK] Resend configured - OTP emails will be sent for real");
  } else {
    console.log("  [WARN] Resend not configured - OTP codes will be logged to this console instead");
  }

  if (!dbOk || !redisOk) {
    console.log("\n  One or more critical services failed to connect. The server will still");
    console.log("  start, but requests depending on them will fail until this is fixed.\n");
  }

  app.listen(env.port, () => {
    console.log(`\nFundiBolt backend is running at: http://localhost:${env.port}\n`);
  });
}

start();
