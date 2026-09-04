import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { prisma } from "../config/prisma";

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }
  const token = header.replace("Bearer ", "");
  try {
    req.user = verifyToken(token);

    // Fire-and-forget: updates the "last seen" timestamp the mobile app's
    // online dot is based on (see utils/onlineStatus.ts on the mobile
    // side). Deliberately not awaited - a slow/failed presence update
    // should never block or fail the actual request.
    prisma.user
      .update({ where: { id: req.user.userId }, data: { lastActiveAt: new Date() } })
      .catch((err) => console.error("Failed to update lastActiveAt:", err));

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
