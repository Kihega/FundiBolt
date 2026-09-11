import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";
import { toAbsoluteAvatarUrl, withAbsoluteAvatarUrl } from "../utils/publicUrl";
import { PUBLIC_USER_SELECT } from "../utils/userSelect";
import { computeQualificationScore } from "../utils/qualification";

// Lets the mobile app refresh the logged-in user's own details (e.g.
// after this session's avatar upload) without a full re-login. Not called
// by the mobile client yet, but kept alongside uploadAvatar since it
// shares the same "get my own profile" shape and rounds out this route
// group.
export async function getMe(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: PUBLIC_USER_SELECT });
    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }
    return res.status(200).json({ user: withAbsoluteAvatarUrl(user) });
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ message: "Could not load your profile." });
  }
}

// Powers the Account screen's "Take Photo" / "Choose from Gallery" flow
// (mobile: screens/AccountScreen.tsx). The file itself is handled by
// multer (see config/upload.ts) before this runs - by the time this
// executes, req.file already points at the saved image on disk.
export async function uploadAvatar(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  const file = (req as AuthedRequest & { file?: Express.Multer.File }).file;
  if (!file) {
    return res.status(400).json({ message: "No image file was uploaded." });
  }

  try {
    // Stored as a relative path (also how it lives in the database) -
    // toAbsoluteAvatarUrl/withAbsoluteAvatarUrl below are what turn this,
    // and every other avatarUrl this API ever returns, into a full URL
    // the mobile app can load directly. Getting this conversion applied
    // consistently everywhere (not just here) is what fixes avatars
    // failing to show up after a fresh login.
    const relativeAvatarUrl = `/uploads/avatars/${file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatarUrl: relativeAvatarUrl },
      select: PUBLIC_USER_SELECT,
    });

    return res.status(200).json({ user: withAbsoluteAvatarUrl(user), avatarUrl: toAbsoluteAvatarUrl(relativeAvatarUrl) });
  } catch (err) {
    console.error("Upload avatar error:", err);
    return res.status(500).json({ message: "Could not save your profile photo. Please try again." });
  }
}

function parseLatOrLng(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

// Powers a technician's live location ping, sent periodically while
// their app is foregrounded (see mobile:
// hooks/useTechnicianLocationBroadcast.ts) - this is what makes them
// show up on a customer's nearby-technicians map (see
// technician.controller.ts#getNearbyTechnicians). Restricted to fundi
// accounts only: customers and admins have no feature that uses their
// location, so there's no reason to accept or store it for them
// (data-minimization - don't collect what nothing reads back).
export async function updateMyLocation(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }
  if (req.user.role !== "fundi") {
    return res.status(403).json({ message: "Only technician accounts can update location." });
  }

  const latitude = parseLatOrLng(req.body.latitude, -90, 90);
  const longitude = parseLatOrLng(req.body.longitude, -180, 180);
  if (latitude === null || longitude === null) {
    return res.status(400).json({ message: "Valid latitude and longitude are required." });
  }

  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { latitude, longitude, locationUpdatedAt: new Date() },
    });
    return res.status(200).json({ message: "Location updated." });
  } catch (err) {
    console.error("Update location error:", err);
    return res.status(500).json({ message: "Could not update your location." });
  }
}

const MAX_BIO_LENGTH = 1000;
const MAX_SKILLS = 20;

// Powers the technician profile/qualification screen (mobile:
// screens/TechnicianProfileScreen.tsx). Restricted to fundi accounts -
// these fields are meaningless for customer/admin accounts. Every field is
// optional per-request (only whatever's included gets updated), and
// qualificationScore is always recomputed from the FULL resulting profile
// (not just the fields in this request) so it never drifts out of sync
// with what's actually stored.
export async function updateTechnicianProfile(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }
  if (req.user.role !== "fundi") {
    return res.status(403).json({ message: "Only technician accounts have a technician profile." });
  }

  const { specialty, skills, bio, hourlyRate, yearsExperience } = req.body;

  const data: Record<string, unknown> = {};

  if (specialty !== undefined) {
    if (typeof specialty !== "string" || specialty.length > 100) {
      return res.status(400).json({ message: "specialty must be a string up to 100 characters." });
    }
    data.specialty = specialty || null;
  }

  if (skills !== undefined) {
    if (!Array.isArray(skills) || !skills.every((s) => typeof s === "string")) {
      return res.status(400).json({ message: "skills must be an array of strings." });
    }
    if (skills.length > MAX_SKILLS) {
      return res.status(400).json({ message: `skills can have at most ${MAX_SKILLS} entries.` });
    }
    data.skills = skills.map((s: string) => s.trim()).filter(Boolean);
  }

  if (bio !== undefined) {
    if (typeof bio !== "string" || bio.length > MAX_BIO_LENGTH) {
      return res.status(400).json({ message: `bio must be a string up to ${MAX_BIO_LENGTH} characters.` });
    }
    data.bio = bio || null;
  }

  if (hourlyRate !== undefined) {
    const rate = Number(hourlyRate);
    if (!Number.isFinite(rate) || rate < 0) {
      return res.status(400).json({ message: "hourlyRate must be a non-negative number." });
    }
    data.hourlyRate = rate;
  }

  if (yearsExperience !== undefined) {
    const years = Number(yearsExperience);
    if (!Number.isInteger(years) || years < 0 || years > 80) {
      return res.status(400).json({ message: "yearsExperience must be a whole number between 0 and 80." });
    }
    data.yearsExperience = years;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: "No valid fields to update." });
  }

  try {
    const current = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!current) {
      return res.status(404).json({ message: "Account not found." });
    }

    const merged = { ...current, ...data } as typeof current;
    const qualificationScore = computeQualificationScore(merged).score;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { ...data, qualificationScore },
      select: PUBLIC_USER_SELECT,
    });

    return res.status(200).json({ user: withAbsoluteAvatarUrl(user) });
  } catch (err) {
    console.error("Update technician profile error:", err);
    return res.status(500).json({ message: "Could not update your profile." });
  }
}

// Powers the ID-verification step of the technician profile screen. Same
// multer-then-controller pattern as uploadAvatar (see config/upload.ts's
// idDocumentUpload) - by the time this runs, req.file already points at
// the saved file on disk.
export async function uploadIdDocument(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }
  if (req.user.role !== "fundi") {
    return res.status(403).json({ message: "Only technician accounts can upload ID verification." });
  }

  const file = (req as AuthedRequest & { file?: Express.Multer.File }).file;
  if (!file) {
    return res.status(400).json({ message: "No document file was uploaded." });
  }

  try {
    const relativeIdDocumentUrl = `/uploads/id-documents/${file.filename}`;

    const current = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!current) {
      return res.status(404).json({ message: "Account not found." });
    }

    const merged = { ...current, idDocumentUrl: relativeIdDocumentUrl };
    const qualificationScore = computeQualificationScore(merged).score;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { idDocumentUrl: relativeIdDocumentUrl, qualificationScore },
      select: PUBLIC_USER_SELECT,
    });

    return res.status(200).json({ user: withAbsoluteAvatarUrl(user) });
  } catch (err) {
    console.error("Upload ID document error:", err);
    return res.status(500).json({ message: "Could not save your ID document. Please try again." });
  }
}
