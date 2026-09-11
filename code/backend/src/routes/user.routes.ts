import { Router } from "express";
import { getMe, uploadAvatar, updateMyLocation, updateTechnicianProfile, uploadIdDocument } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { avatarUpload, idDocumentUpload } from "../config/upload";

const router = Router();

router.get("/me", requireAuth, getMe);
router.post("/me/avatar", requireAuth, avatarUpload.single("avatar"), uploadAvatar);
router.patch("/me/location", requireAuth, updateMyLocation);
router.patch("/me/technician-profile", requireAuth, updateTechnicianProfile);
router.post("/me/id-document", requireAuth, idDocumentUpload.single("document"), uploadIdDocument);

export default router;
