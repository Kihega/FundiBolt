import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Keyboard, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../theme/LanguageContext";
import { useResponsive } from "../theme/responsive";
import {
  Conversation,
  Message,
  fetchConversations,
  sendMessage as sendMessageToBackend,
  deleteConversation as deleteConversationOnBackend,
  deleteMessage as deleteMessageOnBackend,
  SUPPORT_CONVERSATION_ID,
} from "../services/messages";
import Avatar from "../components/Avatar";
import SwipeToDelete from "../components/SwipeToDelete";

type Props = {
  token: string;
  /** Set from the side menu's "Customer Services" - opens that conversation immediately on arrival. */
  initialConversationId?: string | null;
  /** Called once initialConversationId has been consumed, so the parent can clear it and avoid re-triggering. */
  onConversationOpened?: () => void;
};

// Chat list + thread, Messenger-style: a list of conversations (unread
// counts, last-message preview) that opens into a bubble thread with a
// composer at the bottom. The FundiBolt Customer Service conversation
// (see services/messages.ts) is always present, even before any
// technician conversations exist, since "Customer Services" in the side
// menu routes here.
export default function MessagesScreen({ token, initialConversationId, onConversationOpened }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const { t } = useLanguage();
  const { maxContentWidth } = useResponsive();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef<FlatList<Message>>(null);

  // Manual keyboard tracking instead of KeyboardAvoidingView: on Android,
  // KeyboardAvoidingView's "height" behavior turned out to still leave the
  // composer covered on some devices/keyboards (it depends on the OS
  // already reporting an accurate resize, which isn't always reliable).
  // Listening for the raw show/hide events and pushing the composer up by
  // exactly the reported keyboard height works regardless of that, and
  // the scrollToEnd call brings the latest message into view right above
  // the keyboard the moment it opens, rather than leaving it wherever it
  // was scrolled to before.
  useEffect(() => {
    const showEvent = Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
    const hideEvent = Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      // Wait a beat for the padding change above to actually lay out
      // before scrolling, or this can scroll to the pre-resize position.
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    fetchConversations(token).then(setConversations);
  }, [token]);

  useEffect(() => {
    if (!initialConversationId || conversations.length === 0) return;

    // SUPPORT_CONVERSATION_ID is a client-side sentinel, not a real
    // conversation id - the backend's actual support conversation has its
    // own generated id (it's created server-side the first time this
    // customer's conversation list is fetched - see
    // conversation.controller.ts). Resolve by isSupport instead of id so
    // this keeps working however the backend numbers it.
    const target =
      initialConversationId === SUPPORT_CONVERSATION_ID
        ? conversations.find((c) => c.isSupport)
        : conversations.find((c) => c.id === initialConversationId);

    if (target) {
      setOpenId(target.id);
      onConversationOpened?.();
    }
    // onConversationOpened is intentionally excluded - it's a fresh
    // closure each render in the parent and isn't meant to retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, conversations]);

  const openConversation = conversations.find((c) => c.id === openId) || null;

  function handleOpen(id: string) {
    setOpenId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !openId) return;

    const message: Message = {
      id: `local-${Date.now()}`,
      conversationId: openId,
      text,
      sender: "me",
      sentAt: new Date().toISOString(),
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === openId ? { ...c, messages: [...c.messages, message], lastMessage: text, lastMessageAt: message.sentAt } : c))
    );
    setDraft("");
    sendMessageToBackend(openId, text, token);

    // Canned auto-reply so the thread feels alive - there's no real
    // technician/support backend wired up yet (see services/messages.ts).
    const conversationId = openId;
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          const reply: Message = {
            id: `auto-${Date.now()}`,
            conversationId,
            text: c.isSupport ? t("messages.supportAutoReply") : t("messages.technicianAutoReply"),
            sender: "them",
            sentAt: new Date().toISOString(),
          };
          return { ...c, messages: [...c.messages, reply], lastMessage: reply.text, lastMessageAt: reply.sentAt };
        })
      );
    }, 900);
  }

  // Swiping a conversation row removes it immediately (see
  // SwipeToDelete's own note on why a full swipe needs no separate
  // confirmation dialog), then best-effort deletes it on the backend.
  function handleDeleteConversation(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setOpenId((prev) => (prev === id ? null : prev));
    deleteConversationOnBackend(id, token);
  }

  // Only ever wired up for the customer's own ("me") bubbles - see
  // MessageBubble below - matching what the backend allows deleting.
  function handleDeleteMessage(messageId: string) {
    if (!openId) return;
    const conversationId = openId;
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c))
    );
    deleteMessageOnBackend(conversationId, messageId, token);
  }

  if (openConversation) {
    return (
      // paddingBottom eats into this container's own height rather than
      // shrinking it via a library behavior - the composer at the bottom
      // gets pushed up by exactly the keyboard's real height, tracked
      // above, which is what actually fixed this staying reliable across
      // devices/keyboards.
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <View style={[styles.chatHeader, { borderBottomColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
          <TouchableOpacity onPress={() => setOpenId(null)} accessibilityRole="button" accessibilityLabel={t("messages.back")}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Avatar uri={openConversation.participantAvatarUrl} name={openConversation.participantName} size={34} />
          <Text
            numberOfLines={1}
            style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.base, marginLeft: spacing.sm }}
          >
            {openConversation.participantName}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={openConversation.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.md, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <MessageBubble message={item} onDelete={() => handleDeleteMessage(item.id)} />}
        />

        <View style={[styles.composer, { borderTopColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t("messages.inputPlaceholder")}
            placeholderTextColor={colors.placeholder}
            multiline
            style={[
              styles.composerInput,
              { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.full, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm },
            ]}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!draft.trim()}
            style={[styles.sendButton, { backgroundColor: colors.primary, borderRadius: radius.full, opacity: draft.trim() ? 1 : 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel={t("messages.send")}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(c) => c.id}
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.lg, flexGrow: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center" }}
      ListHeaderComponent={
        <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.xl, marginBottom: spacing.md }}>
          {t("messages.title")}
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: spacing.sm, textAlign: "center" }}>
            {t("messages.empty")}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <SwipeToDelete onDelete={() => handleDeleteConversation(item.id)} accessibilityLabel={`${t("messages.delete")} ${item.participantName}`}>
          <ConversationRow conversation={item} onPress={() => handleOpen(item.id)} />
        </SwipeToDelete>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    />
  );
}

function ConversationRow({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.conversationRow,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.sm },
      ]}
    >
      <Avatar uri={conversation.participantAvatarUrl} name={conversation.participantName} size={48} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.sm }}>
          {conversation.participantName}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginTop: 2 }}>
          {conversation.lastMessage}
        </Text>
      </View>
      {conversation.unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: colors.primary, borderRadius: radius.full }]}>
          <Text style={{ color: "#FFFFFF", fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.xs }}>{conversation.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MessageBubble({ message, onDelete }: { message: Message; onDelete: () => void }) {
  const { colors, fontFamily, fontSize, radius } = useTheme();
  const isMe = message.sender === "me";

  const bubble = (
    <View style={[styles.bubbleRow, { justifyContent: isMe ? "flex-end" : "flex-start" }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isMe ? colors.primary : colors.surfaceElevated,
            borderRadius: radius.lg,
            borderBottomRightRadius: isMe ? 4 : radius.lg,
            borderBottomLeftRadius: isMe ? radius.lg : 4,
          },
        ]}
      >
        <Text style={{ color: isMe ? "#FFFFFF" : colors.textPrimary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm }}>
          {message.text}
        </Text>
      </View>
    </View>
  );

  // Only your own messages are swipeable - the backend only allows a
  // sender to delete their own messages (see deleteMessage in
  // conversation.controller.ts), so there's no point offering the
  // gesture on the other party's bubbles.
  if (!isMe) return bubble;

  return <SwipeToDelete onDelete={onDelete}>{bubble}</SwipeToDelete>;
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 64 },
  conversationRow: { flexDirection: "row", alignItems: "center", borderWidth: 1 },
  unreadBadge: { minWidth: 22, height: 22, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  chatHeader: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  bubbleRow: { flexDirection: "row", marginBottom: 8 },
  bubble: { maxWidth: "78%", paddingHorizontal: 12, paddingVertical: 8 },
  composer: { flexDirection: "row", alignItems: "flex-end", borderTopWidth: 1 },
  composerInput: { flex: 1, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100, marginRight: 8 },
  sendButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
});
