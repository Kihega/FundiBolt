// Dev/test convenience: a fixed OTP code that always verifies
// successfully, so test signups can be completed without reading a real
// inbox (see controllers/otp.controller.ts for where it's issued and
// accepted).
//
// Requires BOTH of the following to be active:
//   1. NODE_ENV is not exactly "production", AND
//   2. ENABLE_DEV_OTP_BYPASS is explicitly set to the string "true"
//
// This is deliberately belt-and-suspenders rather than gating on NODE_ENV
// alone: a staging/preview/misconfigured environment that's reachable by
// real users but doesn't happen to have NODE_ENV set to exactly
// "production" (a typo, different casing, a platform default, an unset
// variable, ...) would otherwise leave this bypass silently active with
// no second safeguard. Requiring an explicit, separate opt-in means the
// bypass defaults to OFF everywhere unless someone deliberately turns it
// on - a missing or wrong NODE_ENV can only ever fail closed, never open.
//
// Set ENABLE_DEV_OTP_BYPASS=true in your local .env (see .env.example)
// to keep using the fixed code during development.
//
// Both env vars are read directly at module-load time - not via a cached
// config wrapper - so that flipping them before this module is first
// required (e.g. in tests/otp.controller.test.ts's "DEV_BYPASS_CODE
// respects NODE_ENV" suite, which calls jest.resetModules() then
// re-requires this file) takes effect immediately, with no stale state
// left over from a previous environment.
export const DEV_BYPASS_CODE: string | null =
  process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_OTP_BYPASS === "true" ? "123456" : null;
