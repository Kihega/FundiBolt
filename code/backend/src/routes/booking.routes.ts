import { Router } from "express";
import { listBookings, createBooking, respondToBooking } from "../controllers/booking.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, listBookings);
router.post("/", requireAuth, createBooking);
router.patch("/:id/respond", requireAuth, respondToBooking);

export default router;
