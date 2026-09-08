import { Request, Response, NextFunction } from "express";

// None of login, signup, forgot-password, or OTP send/verify/resend had
// any throttling before this - each was open to unlimited brute-force or
// credential-stuffing attempts from a single client. This is a minimal,
// dependency-free fixed-window limiter to close that gap now.
//
// In-memory rather than Redis-backed (even though this project already
// has Upstash Redis wired up - see config/redis.ts) to keep this
// self-contained and avoid adding request latency to every hit. The
// tradeoff: each server process/instance tracks its own counters,
// independently, reset on restart. That's an acceptable limitation for a
// single-instance deployment at this stage - revisit with a shared,
// Redis-backed limiter before ever running multiple instances behind a
// load balancer, since a limiter that doesn't share state across
// instances is trivially bypassed by an attacker hitting a different one
// each time.
type Bucket = { count: number; resetAt: number };

export function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  const buckets = new Map<string, Bucket>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    // Keyed by IP + route, so a burst against one endpoint doesn't eat
    // into the budget for a completely different one.
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (bucket.count >= options.max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ message: options.message });
    }

    bucket.count += 1;
    return next();
  };
}

// Shared instances for the auth-sensitive endpoints that need this (see
// routes/auth.routes.ts, routes/otp.routes.ts). Separate limiters (rather
// than one shared one) so, e.g., someone hammering /login doesn't also
// use up a signup attacker's own separate budget, or vice versa.
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again in a few minutes.",
});

export const signupRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many signup attempts. Please try again later.",
});

export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests. Please try again later.",
});

export const otpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many verification attempts. Please try again later.",
});
