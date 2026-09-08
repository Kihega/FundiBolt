import { Router } from "express";
import { getNearbyTechnicians } from "../controllers/technician.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/nearby", requireAuth, getNearbyTechnicians);

export default router;
