import { Redis } from "@upstash/redis";
import { env } from "./env";

export const redis = new Redis({
  url: env.upstashRedisUrl,
  token: env.upstashRedisToken,
});

export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.set("healthcheck", "ok", { ex: 10 });
    const value = await redis.get("healthcheck");
    return value === "ok";
  } catch (err) {
    console.error("Redis connection check failed:", err);
    return false;
  }
}
