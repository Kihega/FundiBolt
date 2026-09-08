import { Router } from "express";
import { getMe, uploadAvatar, updateMyLocation } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { avatarUpload } from "../config/upload";

const router = Router();

router.get("/me", requireAuth, getMe);
router.post("/me/avatar", requireAuth, avatarUpload.single("avatar"), uploadAvatar);
router.patch("/me/location", requireAuth, updateMyLocation);

export default router;
