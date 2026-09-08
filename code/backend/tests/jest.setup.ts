// Runs before any test file (and before src/config/env.ts is imported by
// anything under test). Provides safe placeholder values so the required()
// checks in config/env.ts don't throw in CI or on a fresh clone - dotenv's
// dotenv.config() call inside env.ts does NOT override variables that are
// already set on process.env, so these placeholders win.

process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.PORT = process.env.PORT || "4000";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/fundibolt_test";
process.env.DATABASE_URL_DIRECT = process.env.DATABASE_URL_DIRECT || "postgresql://test:test@localhost:5432/fundibolt_test";
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || "https://example-test-instance.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "test-token";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "";
process.env.EMAIL_FROM = process.env.EMAIL_FROM || "FundiBolt <onboarding@resend.dev>";

// Required (in addition to NODE_ENV !== "production") for the OTP dev
// bypass code to be active - see services/otpService.ts. Every existing
// test that relies on the fixed "123456" code needs this explicitly set;
// without it, NODE_ENV=test alone is no longer enough (see that file's
// doc comment for why that's now a deliberate two-factor gate).
process.env.ENABLE_DEV_OTP_BYPASS = process.env.ENABLE_DEV_OTP_BYPASS || "true";
