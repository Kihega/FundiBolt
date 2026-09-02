import { Request, Response } from "express";
import { redis } from "../config/redis";
import { prisma } from "../config/prisma";
import {
  otpKey,
  cooldownKey,
  pendingSignupKey,
  PENDING_SIGNUP_TTL_SECONDS,
  issueOtp,
  isOtpMatch,
  parsePendingSignup,
} from "../services/otpService";

// Resend (and the internal re-send used by signup's first code) both funnel
// through here. A pending signup must already exist for the email - this
// endpoint never creates one, only signup() does.
export async function sendOtp(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const pendingRaw = await redis.get(pendingSignupKey(email));
    if (!pendingRaw) {
      return res.status(400).json({ message: "No pending registration found for this email. Please sign up again." });
    }

    const cooldown = await redis.get(cooldownKey(email));
    if (cooldown) {
      return res.status(429).json({ message: "Please wait before requesting another code." });
    }

    await issueOtp(email);
    // Refresh the pending-signup TTL so it doesn't expire while a freshly
    // resent code is still active.
    await redis.expire(pendingSignupKey(email), PENDING_SIGNUP_TTL_SECONDS);

    return res.status(200).json({ message: "Verification code sent." });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ message: "Could not send verification code." });
  }
}

export async function resendOtp(req: Request, res: Response) {
  return sendOtp(req, res);
}

// The account is only created here, once the code is confirmed - not at
// signup time. If the OTP expired (5 minutes) or the pending-signup entry
// expired alongside it, verification fails and the person has to sign up
// again rather than ending up with a stale unverified row in the database.
export async function verifyOtp(req: Request, res: Response) {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required." });
  }

  try {
    const stored = await redis.get<string>(otpKey(email));
    if (!isOtpMatch(stored, code)) {
      return res.status(400).json({ message: "Invalid or expired code." });
    }

    const alreadyCreated = await prisma.user.findFirst({ where: { email } });
    if (alreadyCreated) {
      // Idempotent: a double-tap on Verify (or a retried request) shouldn't
      // error just because the account was already created a moment ago.
      await redis.del(otpKey(email));
      await redis.del(pendingSignupKey(email));
      return res.status(200).json({ message: "Email verified successfully." });
    }

    const pendingRaw = await redis.get(pendingSignupKey(email));
    const pending = parsePendingSignup(pendingRaw);
    if (!pending) {
      return res.status(400).json({ message: "Your registration session has expired. Please sign up again." });
    }

    await prisma.user.create({
      data: {
        fullName: pending.fullName,
        email: pending.email,
        phone: pending.phone,
        passwordHash: pending.passwordHash,
        role: pending.role as any,
        emailVerified: true,
      },
    });

    await redis.del(otpKey(email));
    await redis.del(pendingSignupKey(email));

    return res.status(200).json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Could not verify code." });
  }
}
