import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";

// Only these two roles are self-selectable at signup. "admin" is
// intentionally excluded here so a crafted request body can't grant an
// account admin privileges - admin accounts must be created some other,
// non-public way.
const SELF_SIGNUP_ROLES = ["customer", "fundi"] as const;
type SelfSignupRole = (typeof SELF_SIGNUP_ROLES)[number];

function normalizeSignupRole(role: unknown): SelfSignupRole {
  return (SELF_SIGNUP_ROLES as readonly unknown[]).includes(role) ? (role as SelfSignupRole) : "customer";
}

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

    const user = await prisma.user.create({
      data: { fullName, email, phone: phone || null, passwordHash, role: signupRole },
      select: { id: true, fullName: true, email: true, phone: true, role: true, emailVerified: true, createdAt: true },
    });

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(201).json({ user, token });
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

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Something went wrong during login." });
  }
}
