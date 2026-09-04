import { app } from "./app";
import { env } from "./config/env";
import { checkDbConnection } from "./config/prisma";
import { checkRedisConnection } from "./config/redis";
import { colorize } from "./utils/terminalColors";

function logConnectionStatus(label: string, ok: boolean) {
  console.log(`${label}: ${colorize(ok ? "OK" : "FAILED", ok ? "green" : "red")}`);
}

async function start() {
  const dbOk = await checkDbConnection();
  logConnectionStatus("Database connection", dbOk);

  const redisOk = await checkRedisConnection();
  logConnectionStatus("Redis connection", redisOk);

  app.listen(env.port, () => {
    console.log(colorize(`FundiBolt API running at: http://localhost:${env.port}`, "cyan"));
  });
}

start();
