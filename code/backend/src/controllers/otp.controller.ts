import { Request, Response } from "express";
import { redis } from "../config/redis";
import { generateOtp } from "../utils/otp";
import { sendOtpEmail } from "../config/email";
import { prisma } from "../config/prisma";

const OTP_TTL_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

function otpKey(email: string) {
  return `otp:${email.toLowerCase()}`;
}
function cooldownKey(email: string) {
  return `otp-cooldown:${email.toLowerCase()}`;
}

export async function sendOtp(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const cooldown = await redis.get(cooldownKey(email));
    if (cooldown) {
      return res.status(429).json({ message: "Please wait before requesting another code." });
    }

    const code = generateOtp(6);
    await redis.set(otpKey(email), code, { ex: OTP_TTL_SECONDS });
    await redis.set(cooldownKey(email), "1", { ex: RESEND_COOLDOWN_SECONDS });

    await sendOtpEmail(email, code);

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
    const isValid = !!stored && stored === code;

    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired code." });
    }

    await redis.del(otpKey(email));

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    return res.status(200).json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Could not verify code." });
  }
}
