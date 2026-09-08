import { Router } from "express";
import { signup, login, changePassword, forgotPassword } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { loginRateLimiter, signupRateLimiter, forgotPasswordRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/signup", signupRateLimiter, signup);
router.post("/login", loginRateLimiter, login);
router.post("/change-password", requireAuth, changePassword);
router.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);

export default router;
