import { redis } from "../config/redis";
import { generateOtp } from "../utils/otp";
import { sendOtpEmail } from "../config/email";
import { env } from "../config/env";

export const OTP_TTL_SECONDS = 5 * 60;
export const RESEND_COOLDOWN_SECONDS = 30;
export const PENDING_SIGNUP_TTL_SECONDS = 5 * 60;

// Dev-only OTP bypass so registration can be exercised end-to-end without a
// working email provider - e.g. against fake/test addresses that can never
// actually receive mail. A real, correctly-generated code still works
// normally; this is purely an additional accepted value on top of that.
// NEVER active when NODE_ENV=production, no matter what.
export const DEV_BYPASS_CODE = env.nodeEnv !== "production" ? "123456" : null;

export function otpKey(email: string) {
  return `otp:${email.toLowerCase()}`;
}
export function cooldownKey(email: string) {
  return `otp-cooldown:${email.toLowerCase()}`;
}
export function pendingSignupKey(email: string) {
  return `pending-signup:${email.toLowerCase()}`;
}

export type PendingSignup = {
  fullName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: string;
};

// Generates a fresh OTP, stores it (5 min TTL), sets the resend cooldown,
// and emails it. Does not touch pending-signup data - callers are
// responsible for that (signup() creates it, sendOtp()/resendOtp() just
// refresh its TTL so it doesn't expire out from under an in-flight resend).
export async function issueOtp(email: string): Promise<void> {
  const code = generateOtp(6);
  await redis.set(otpKey(email), code, { ex: OTP_TTL_SECONDS });
  await redis.set(cooldownKey(email), "1", { ex: RESEND_COOLDOWN_SECONDS });
  await sendOtpEmail(email, code);
}

export function isOtpMatch(storedCode: string | null | undefined, submittedCode: string): boolean {
  if (DEV_BYPASS_CODE !== null && submittedCode === DEV_BYPASS_CODE) {
    return true;
  }
  return !!storedCode && storedCode === submittedCode;
}

export function parsePendingSignup(raw: unknown): PendingSignup | null {
  if (!raw) return null;
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!data || typeof data !== "object") return null;
    if (!data.email || !data.fullName || !data.passwordHash || !data.role) return null;
    return data as PendingSignup;
  } catch {
    return null;
  }
}
