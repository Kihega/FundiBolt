import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const SUPPORT_WELCOME_TEXT = "Hi! How can we help you today?";

type ConversationWithRelations = {
  id: string;
  isSupport: boolean;
  technician: { fullName: string; avatarUrl: string | null } | null;
  messages: { id: string; text: string; senderId: string | null; createdAt: Date }[];
};

// Shape the mobile app's MessagesScreen expects (see mobile:
// services/messages.ts) - a flattened participant name/avatar rather than
// a nested customer/technician relation, and each message tagged "me" vs
// "them" from the requesting user's point of view rather than a raw
// sender id.
function toConversationResponse(conversation: ConversationWithRelations, viewerUserId: string) {
  const messages = conversation.messages.map((m) => ({
    id: m.id,
    conversationId: conversation.id,
    text: m.text,
    sender: m.senderId === viewerUserId ? "me" : "them",
    sentAt: m.createdAt.toISOString(),
  }));
  const last = messages[messages.length - 1];

  return {
    id: conversation.id,
    participantName: conversation.isSupport ? "FundiBolt Customer Service" : conversation.technician?.fullName || "Technician",
    participantAvatarUrl: conversation.isSupport ? null : conversation.technician?.avatarUrl || null,
    isSupport: conversation.isSupport,
    lastMessage: last?.text || "",
    lastMessageAt: last?.sentAt || new Date().toISOString(),
    // Real read-tracking (per-participant "last read" state) isn't built
    // yet - always 0 for now. The mobile app already handles marking a
    // conversation read locally the moment it's opened, so this only
    // matters once unread state needs to survive across sessions/devices.
    unreadCount: 0,
    messages,
  };
}

async function getOrCreateSupportConversation(customerId: string) {
  const existing = await prisma.conversation.findFirst({
    where: { customerId, isSupport: true },
    include: { technician: { select: { fullName: true, avatarUrl: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      customerId,
      isSupport: true,
      messages: { create: [{ text: SUPPORT_WELCOME_TEXT, senderId: null }] },
    },
    include: { technician: { select: { fullName: true, avatarUrl: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
}

// Every customer always has (at least) the FundiBolt Customer Service
// conversation, created on first access - plus one conversation per
// technician they've messaged. Powers MessagesScreen's conversation list.
export async function listConversations(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  try {
    if (req.user.role === "fundi") {
      // Technicians only see their conversations with customers - no
      // support thread of their own from this endpoint (support for
      // technicians belongs to the not-yet-built technician app).
      const conversations = await prisma.conversation.findMany({
        where: { technicianId: req.user.userId },
        include: { technician: { select: { fullName: true, avatarUrl: true } }, messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { updatedAt: "desc" },
      });
      return res.status(200).json({ conversations: conversations.map((c) => toConversationResponse(c, req.user!.userId)) });
    }

    const support = await getOrCreateSupportConversation(req.user.userId);
    const technicianConversations = await prisma.conversation.findMany({
      where: { customerId: req.user.userId, isSupport: false },
      include: { technician: { select: { fullName: true, avatarUrl: true } }, messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });

    const all = [support, ...technicianConversations];
    return res.status(200).json({ conversations: all.map((c) => toConversationResponse(c, req.user!.userId)) });
  } catch (err) {
    console.error("List conversations error:", err);
    return res.status(500).json({ message: "Could not load conversations." });
  }
}

// Appends a message to an existing conversation. The conversation must
// belong to the requester (as either its customer or its technician).
export async function sendMessage(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  const { id } = req.params;
  const { text } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ message: "text is required." });
  }

  try {
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    const isParticipant =
      !!conversation && (conversation.customerId === req.user.userId || conversation.technicianId === req.user.userId);
    if (!conversation || !isParticipant) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const message = await prisma.message.create({
      data: { conversationId: id, senderId: req.user.userId, text: text.trim() },
    });
    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    return res.status(201).json({
      message: {
        id: message.id,
        conversationId: id,
        text: message.text,
        sender: "me",
        sentAt: message.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Send message error:", err);
    return res.status(500).json({ message: "Could not send the message." });
  }
}

// Powers the swipe-to-delete gesture on a conversation row (mobile:
// components/SwipeToDelete.tsx used in screens/MessagesScreen.tsx). The
// conversation must belong to the requester (as either its customer or
// its technician) - same participant check as sendMessage above.
//
// Messages reference their conversation with ON DELETE RESTRICT (see the
// migration that created these tables), so its messages are deleted
// first, in the same transaction, rather than requiring a second
// migration just to change that constraint to CASCADE.
export async function deleteConversation(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  const { id } = req.params;

  try {
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    const isParticipant =
      !!conversation && (conversation.customerId === req.user.userId || conversation.technicianId === req.user.userId);
    if (!conversation || !isParticipant) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    await prisma.$transaction([
      prisma.message.deleteMany({ where: { conversationId: id } }),
      prisma.conversation.delete({ where: { id } }),
    ]);

    return res.status(200).json({ message: "Conversation deleted." });
  } catch (err) {
    console.error("Delete conversation error:", err);
    return res.status(500).json({ message: "Could not delete the conversation." });
  }
}

// Powers the swipe-to-delete gesture on an individual chat bubble.
// Deliberately restricted to the message's own sender (matching what the
// mobile UI already only offers swipe-delete on: your own "me" bubbles) -
// deleting someone else's message out from under them isn't allowed here,
// and system-authored messages (senderId null, e.g. the support
// conversation's opening greeting) can't be deleted through this endpoint
// at all.
export async function deleteMessage(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  const { id: conversationId, messageId } = req.params;

  try {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.conversationId !== conversationId) {
      return res.status(404).json({ message: "Message not found." });
    }
    if (message.senderId !== req.user.userId) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }

    await prisma.message.delete({ where: { id: messageId } });

    return res.status(200).json({ message: "Message deleted." });
  } catch (err) {
    console.error("Delete message error:", err);
    return res.status(500).json({ message: "Could not delete the message." });
  }
}
