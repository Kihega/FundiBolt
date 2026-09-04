// Dev/test convenience: a fixed OTP code that always verifies
// successfully, so test signups can be completed without reading a real
// inbox (see controllers/otp.controller.ts for where it's issued and
// accepted).
//
// Gated directly on process.env.NODE_ENV, read at module-load time - not
// via a cached config wrapper - so that flipping NODE_ENV before this
// module is first required (e.g. in tests/otp.controller.test.ts's
// "DEV_BYPASS_CODE respects NODE_ENV" suite, which calls
// jest.resetModules() then re-requires this file) takes effect
// immediately, with no stale state left over from a previous environment.
//
// This is null - i.e. completely inert - whenever NODE_ENV is exactly
// "production". Nothing else in this codebase can turn it back on for a
// production environment.
export const DEV_BYPASS_CODE: string | null = process.env.NODE_ENV === "production" ? null : "123456";
