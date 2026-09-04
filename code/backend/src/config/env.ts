import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

export const env = {
  port,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: required("DATABASE_URL"),
  databaseUrlDirect: process.env.DATABASE_URL_DIRECT || "",
  upstashRedisUrl: required("UPSTASH_REDIS_REST_URL"),
  upstashRedisToken: required("UPSTASH_REDIS_REST_TOKEN"),
  jwtSecret: required("JWT_SECRET"),

  // Optional - if not set, OTP codes are logged to the console instead of emailed.
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "FundiBolt <onboarding@resend.dev>",

  // The API's own publicly-reachable base URL, used to turn a stored
  // relative path like "/uploads/avatars/<file>" (see config/upload.ts)
  // into a full URL the mobile app can actually load an <Image> from
  // (see utils/publicUrl.ts). Defaults to localhost for local dev - set
  // this to the real deployed API URL (e.g. an ngrok/tunnel URL during
  // device testing, or the production domain) so avatars served from
  // anywhere other than localhost actually render on-device.
  publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${port}`,
};
