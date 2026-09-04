import { Router } from "express";
import { getMe, uploadAvatar } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { avatarUpload } from "../config/upload";

const router = Router();

router.get("/me", requireAuth, getMe);
router.post("/me/avatar", requireAuth, avatarUpload.single("avatar"), uploadAvatar);

export default router;
