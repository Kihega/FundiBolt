import fs from "fs";
import path from "path";
import multer from "multer";

// Local-disk storage for profile photos, served statically from
// src/app.ts (`app.use("/uploads", express.static(...))`). This is a
// deliberately simple, dependency-light choice for now - swapping to
// object storage (S3, Cloudinary, etc.) later only means changing this
// file and the `avatarUrl` value uploadAvatar() writes to the database;
// nothing else in the API contract (the endpoint, the response shape,
// or the mobile client) needs to change.
export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const AVATARS_DIR = path.join(UPLOADS_ROOT, "avatars");
export const ID_DOCUMENTS_DIR = path.join(UPLOADS_ROOT, "id-documents");

fs.mkdirSync(AVATARS_DIR, { recursive: true });
fs.mkdirSync(ID_DOCUMENTS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB - generous for a compressed phone-camera photo, small enough to keep disk/bandwidth use sane.

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const authedReq = req as typeof req & { user?: { userId: string } };
    const ext = file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
    // Prefixed with the user's own id (not guessable from another user's
    // token) plus a timestamp, so re-uploads don't collide or overwrite
    // each other mid-request.
    const userId = authedReq.user?.userId || "anon";
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: MAX_AVATAR_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, or WEBP images are allowed."));
      return;
    }
    cb(null, true);
  },
});

// Government ID verification, used only to compute qualificationScore
// (see utils/qualification.ts) - restricted to fundi accounts at the
// route level (technician-only), not here.
const ALLOWED_ID_DOCUMENT_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_ID_DOCUMENT_BYTES = 8 * 1024 * 1024; // 8MB - a bit more headroom than a photo for a scanned/photographed ID.

const idDocumentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ID_DOCUMENTS_DIR),
  filename: (req, file, cb) => {
    const authedReq = req as typeof req & { user?: { userId: string } };
    const ext = file.mimetype === "application/pdf" ? ".pdf" : file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
    const userId = authedReq.user?.userId || "anon";
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

export const idDocumentUpload = multer({
  storage: idDocumentStorage,
  limits: { fileSize: MAX_ID_DOCUMENT_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_ID_DOCUMENT_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WEBP, or PDF files are allowed."));
      return;
    }
    cb(null, true);
  },
});
