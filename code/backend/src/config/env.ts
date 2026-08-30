import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: required("DATABASE_URL"),
  databaseUrlDirect: process.env.DATABASE_URL_DIRECT || "",
  upstashRedisUrl: required("UPSTASH_REDIS_REST_URL"),
  upstashRedisToken: required("UPSTASH_REDIS_REST_TOKEN"),
  jwtSecret: required("JWT_SECRET"),

  // Optional - if not set, OTP codes are logged to the console instead of emailed.
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "FundiBolt <onboarding@resend.dev>",
};
