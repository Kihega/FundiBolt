import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

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
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
