import { Request, Response } from "express";
import { redis } from "../config/redis";
import { generateOtp } from "../utils/otp";
import { DEV_BYPASS_CODE } from "../services/otpService";
import { sendOtpEmail } from "../config/email";
import { prisma } from "../config/prisma";
import { signToken } from "../utils/jwt";
import { withAbsoluteAvatarUrl } from "../utils/publicUrl";
import { PUBLIC_USER_SELECT } from "../utils/userSelect";

export const OTP_TTL_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

// Mirrors OTP_TTL_SECONDS - no point letting a pending signup (see
// signup() in auth.controller.ts) outlive the verification code that's
// the only way to actually finish creating the account.
export const PENDING_SIGNUP_TTL_SECONDS = OTP_TTL_SECONDS;

function otpKey(email: string) {
  return `otp:${email.toLowerCase()}`;
}
function cooldownKey(email: string) {
  return `otp-cooldown:${email.toLowerCase()}`;
}
export function pendingSignupKey(email: string) {
  return `pending-signup:${email.toLowerCase()}`;
}

type IssueOtpResult = { ok: true } | { ok: false; status: number; message: string };

// Shared by the standalone POST /api/otp/send endpoint below and by
// signup() in auth.controller.ts, so both go through the exact same
// pending-signup/cooldown/generation/delivery logic instead of two copies
// that could drift apart.
export async function issueOtp(email: string): Promise<IssueOtpResult> {
  // There's nothing to verify an OTP against unless a signup is actually
  // in progress for this email (auth.controller.ts's signup() always
  // stages the pending record before calling this) - refuse to hand out
  // a code otherwise, rather than sending one into the void.
  const pending = await redis.get(pendingSignupKey(email));
  if (!pending) {
    return { ok: false, status: 400, message: "No pending signup found for this email. Please sign up first." };
  }

  const cooldown = await redis.get(cooldownKey(email));
  if (cooldown) {
    return { ok: false, status: 429, message: "Please wait before requesting another code." };
  }

  // Outside production, every issued code is the fixed DEV_BYPASS_CODE
  // rather than a random one - see services/otpService.ts. This keeps dev
  // testing simple: the code that's actually emailed/logged is always the
  // same one that'll be accepted.
  const code = DEV_BYPASS_CODE ?? generateOtp(6);
  await redis.set(otpKey(email), code, { ex: OTP_TTL_SECONDS });
  await redis.set(cooldownKey(email), "1", { ex: RESEND_COOLDOWN_SECONDS });

  await sendOtpEmail(email, code);

  return { ok: true };
}

export async function sendOtp(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const result = await issueOtp(email);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json({ message: "Verification code sent." });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ message: "Could not send verification code." });
  }
}

export async function resendOtp(req: Request, res: Response) {
  return sendOtp(req, res);
}

export async function verifyOtp(req: Request, res: Response) {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required." });
  }

  try {
    const stored = await redis.get<string>(otpKey(email));
    // Outside production, DEV_BYPASS_CODE is always accepted in addition
    // to whatever code was actually issued - see services/otpService.ts.
    // This never activates in production (DEV_BYPASS_CODE is null there),
    // and even in dev it's still gated below on a real pending signup
    // existing, so it can't be used to "verify" an email nobody ever
    // signed up with.
    const isValid = (!!stored && stored === code) || (DEV_BYPASS_CODE !== null && code === DEV_BYPASS_CODE);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired code." });
    }

    await redis.del(otpKey(email));

    // If this code was issued as part of signup (see auth.controller.ts's
    // signup(), which stages details here instead of creating a user
    // directly), there's a pending-signup payload waiting to become a
    // real account - finish creating it now that the email's been proven.
    const pendingRaw = await redis.get<string>(pendingSignupKey(email));

    if (!pendingRaw) {
      // No pending signup to finish. Either this call isn't part of a
      // signup at all, or - more likely, for someone double-tapping
      // "Verify" - the account was already created by an earlier call to
      // this same endpoint. Treat an already-existing account as a
      // harmless no-op success (idempotent) rather than an error; only if
      // there's truly no account and nothing pending do we ask them to
      // start over.
      const existingUser = await prisma.user.findFirst({ where: { email } });
      if (existingUser) {
        return res.status(200).json({ message: "Email already verified." });
      }
      return res.status(400).json({ message: "Your signup session has expired. Please sign up again." });
    }

    await redis.del(pendingSignupKey(email));
    const pending = JSON.parse(pendingRaw);

    const user = await prisma.user.create({
      data: {
        fullName: pending.fullName,
        email: pending.email,
        phone: pending.phone || null,
        passwordHash: pending.passwordHash,
        role: pending.role,
        emailVerified: true,
        lastActiveAt: new Date(),
      },
      select: PUBLIC_USER_SELECT,
    });

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({ user: withAbsoluteAvatarUrl(user), token });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Could not verify code." });
  }
}
