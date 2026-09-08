import { Router } from "express";
import { sendOtp, verifyOtp, resendOtp } from "../controllers/otp.controller";
import { otpRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/send", otpRateLimiter, sendOtp);
router.post("/verify", otpRateLimiter, verifyOtp);
router.post("/resend", otpRateLimiter, resendOtp);

export default router;
