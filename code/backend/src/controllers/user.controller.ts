import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";
import { toAbsoluteAvatarUrl, withAbsoluteAvatarUrl } from "../utils/publicUrl";
import { PUBLIC_USER_SELECT } from "../utils/userSelect";

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
