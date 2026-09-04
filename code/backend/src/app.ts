import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { checkDbConnection } from "./config/prisma";
import { checkRedisConnection } from "./config/redis";
import { UPLOADS_ROOT } from "./config/upload";
import { requestLogger } from "./middleware/requestLogger";
import authRoutes from "./routes/auth.routes";
import otpRoutes from "./routes/otp.routes";
import userRoutes from "./routes/user.routes";
import bookingRoutes from "./routes/booking.routes";
import conversationRoutes from "./routes/conversation.routes";

export const app = express();

// helmet's default Cross-Origin-Resource-Policy would block the mobile
// app from loading images from /uploads when it's on a different origin
// (its own dev server / native bundle) than the API - this is the
// standard Express+helmet fix, scoped to this one header rather than
// disabling helmet's other protections.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());

// Logs every request (method, path, status, timing) to the terminal - see
// middleware/requestLogger.ts. Placed after body parsing but before any
// routes, so it runs on every request regardless of which route (or no
// route) ends up handling it.
app.use(requestLogger);

// Profile photos uploaded via POST /api/users/me/avatar (see
// config/upload.ts) - served back out from the same path they're saved
// under, so `avatarUrl` values stored on User can be used directly by
// prefixing them with the API's own base URL.
app.use("/uploads", express.static(UPLOADS_ROOT));

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
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/conversations", conversationRoutes);
