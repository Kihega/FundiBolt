import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { generateTempPassword } from "../utils/tempPassword";
import { sendPasswordResetEmail } from "../config/email";
import { withAbsoluteAvatarUrl } from "../utils/publicUrl";
import { issueOtp, pendingSignupKey, PENDING_SIGNUP_TTL_SECONDS } from "./otp.controller";
import { AuthedRequest } from "../middleware/auth.middleware";

// Only these two roles are self-selectable at signup. "admin" is
// intentionally excluded here so a crafted request body can't grant an
// account admin privileges - admin accounts must be created some other,
// non-public way.
const SELF_SIGNUP_ROLES = ["customer", "fundi"] as const;
type SelfSignupRole = (typeof SELF_SIGNUP_ROLES)[number];

function normalizeSignupRole(role: unknown): SelfSignupRole {
  return (SELF_SIGNUP_ROLES as readonly unknown[]).includes(role) ? (role as SelfSignupRole) : "customer";
}

// Signup does NOT create a user row directly - it stages the submitted
// details in Redis (see pendingSignupKey in otp.controller.ts) and sends
// an OTP to the given email. The account only actually gets created once
// that code is verified (verifyOtp in otp.controller.ts reads this same
// pending-signup payload back out and finishes the job) - this means
// nobody ends up with a real, loggable-into account using an email they
// don't actually control. Nothing is returned here to log in with (no
// token, no user) since there's no account yet.
export async function signup(req: Request, res: Response) {
  const { fullName, email, phone, password, role } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "fullName, email, and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const signupRole = normalizeSignupRole(role);

  try {
    const existing = await prisma.user.findFirst({
      where: phone ? { OR: [{ email }, { phone }] } : { email },
    });
    if (existing) {
      return res.status(409).json({ message: "An account with this email or phone already exists." });
    }

    const passwordHash = await hashPassword(password);
    const pendingSignup = { fullName, email, phone: phone || null, passwordHash, role: signupRole };

    await redis.set(pendingSignupKey(email), JSON.stringify(pendingSignup), { ex: PENDING_SIGNUP_TTL_SECONDS });

    const otpResult = await issueOtp(email);
    if (!otpResult.ok) {
      return res.status(otpResult.status).json({ message: otpResult.message });
    }

    return res.status(200).json({ message: "Check your email for a verification code to finish creating your account." });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Something went wrong during signup." });
  }
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Email/phone and password are required." });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      user: withAbsoluteAvatarUrl({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
        lastActiveAt: user.lastActiveAt,
      }),
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Something went wrong during login." });
  }
}

// Powers the Change Password modal (mobile: components/ChangePasswordModal.tsx).
export async function changePassword(req: AuthedRequest, res: Response) {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "oldPassword and newPassword are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    const valid = await comparePassword(oldPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Your old password is incorrect." });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return res.status(200).json({ message: "Your password has been changed." });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ message: "Could not change your password. Please try again." });
  }
}

// Powers "Forgot password?" inside the Change Password modal. Generates a
// temporary password, immediately makes it the account's real password
// (so it works the moment it's used), and emails it via the same
// Resend-or-console-log pattern as OTP delivery (see config/email.ts).
//
// Deliberately always returns the same generic message regardless of
// whether the identifier matched an account - this prevents the endpoint
// from being used to check which emails/phones are registered.
export async function forgotPassword(req: Request, res: Response) {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: "Email or phone is required." });
  }

  const genericResponse = { message: "If an account exists for that email or phone, we've sent a temporary password to it." };

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    if (!user) {
      // Same response either way - see note above.
      return res.status(200).json(genericResponse);
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    await sendPasswordResetEmail(user.email, tempPassword);

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Could not process that request. Please try again." });
  }
}
