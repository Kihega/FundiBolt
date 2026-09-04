import { Router } from "express";
import { signup, login, changePassword, forgotPassword } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/change-password", requireAuth, changePassword);
router.post("/forgot-password", forgotPassword);

export default router;
