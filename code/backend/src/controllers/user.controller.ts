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
