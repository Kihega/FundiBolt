// Customer conversations for the Messages tab - both with technicians and
// with FundiBolt Customer Service.
//
// GET /api/conversations and POST /api/conversations/:id/messages are
// real backend endpoints now (see
// code/backend/src/controllers/conversation.controller.ts). The Customer
// Service conversation is created there automatically the first time a
// customer's conversation list is fetched, so it's always present - that's
// also what "Customer Services" in the side menu opens.

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export type MessageSender = "me" | "them";

export type Message = {
  id: string;
  conversationId: string;
  text: string;
  sender: MessageSender;
  /** ISO 8601 timestamp. */
  sentAt: string;
};

export type Conversation = {
  id: string;
  participantName: string;
  participantAvatarUrl?: string | null;
  /** True only for the built-in FundiBolt Customer Service thread. */
  isSupport?: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
};

export const SUPPORT_CONVERSATION_ID = "support";

function buildFallbackSupportConversation(): Conversation {
  // Used only if the backend is unreachable - real support conversation
  // data (with a real id) normally comes from GET /api/conversations.
  const now = new Date().toISOString();
  return {
    id: SUPPORT_CONVERSATION_ID,
    participantName: "FundiBolt Customer Service",
    participantAvatarUrl: null,
    isSupport: true,
    lastMessage: "Hi! How can we help you today?",
    lastMessageAt: now,
    unreadCount: 0,
    messages: [
      {
        id: "support-welcome",
        conversationId: SUPPORT_CONVERSATION_ID,
        text: "Hi! How can we help you today?",
        sender: "them",
        sentAt: now,
      },
    ],
  };
}

export async function fetchConversations(token: string): Promise<Conversation[]> {
  try {
    const res = await fetch(`${API_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data.conversations) ? data.conversations : [buildFallbackSupportConversation()];
    }
  } catch (err) {
    console.log("fetchConversations: backend unreachable, falling back to a local support-only list", err);
  }

  return [buildFallbackSupportConversation()];
}

/**
 * Best-effort send to the backend. The caller (MessagesScreen) updates
 * its own local state optimistically rather than waiting on this, so a
 * message still appears instantly even on a slow connection.
 */
export async function sendMessage(conversationId: string, text: string, token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.log("sendMessage: backend unreachable, message kept local-only", err);
  }
}

/**
 * Powers swiping a conversation row away in the list (see
 * components/SwipeToDelete.tsx). Best-effort, same as sendMessage above -
 * the caller removes the row from its own local state immediately rather
 * than waiting on this, so the swipe still feels instant offline.
 */
export async function deleteConversation(conversationId: string, token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/conversations/${conversationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.log("deleteConversation: backend unreachable, removed locally only", err);
  }
}

/**
 * Powers swiping an individual chat bubble away within an open
 * conversation. Only ever called on the customer's own ("me") messages -
 * the backend also enforces this, rejecting attempts to delete someone
 * else's message.
 */
export async function deleteMessage(conversationId: string, messageId: string, token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/conversations/${conversationId}/messages/${messageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.log("deleteMessage: backend unreachable, removed locally only", err);
  }
}
