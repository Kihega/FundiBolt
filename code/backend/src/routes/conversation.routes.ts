import { Router } from "express";
import { listConversations, sendMessage, deleteConversation, deleteMessage } from "../controllers/conversation.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, listConversations);
router.post("/:id/messages", requireAuth, sendMessage);
router.delete("/:id", requireAuth, deleteConversation);
router.delete("/:id/messages/:messageId", requireAuth, deleteMessage);

export default router;
