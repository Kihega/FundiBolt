// Presence logic shared by anywhere we show a "green dot" / online indicator
// (top bar profile avatar today, technician map pins once fundi accounts
// exist). Kept as pure functions so it's trivially unit-testable without
// mocking React Native or timers.

// A user counts as "online" if their last activity was within this window.
export const ONLINE_THRESHOLD_MINUTES = 10;

export type OnlineStatus = {
  // Whether to render the green "online" dot on the avatar.
  isOnline: boolean;
  // Human-readable "last seen" text for when the user is offline, or null
  // when they're online (no label needed) or we have no timestamp at all.
  lastSeenLabel: string | null;
};

/**
 * Determine whether a user should be shown as online, based on their last
 * known activity timestamp.
 *
 * @param lastActiveAt ISO 8601 timestamp string, Date, or null/undefined if
 *   the user's activity has never been recorded.
 * @param now Reference "current" time - defaults to `new Date()`, overridable
 *   for deterministic tests.
 */
export function getOnlineStatus(
  lastActiveAt: string | Date | null | undefined,
  now: Date = new Date()
): OnlineStatus {
  if (!lastActiveAt) {
    return { isOnline: false, lastSeenLabel: null };
  }

  const lastActive = typeof lastActiveAt === "string" ? new Date(lastActiveAt) : lastActiveAt;
  if (Number.isNaN(lastActive.getTime())) {
    return { isOnline: false, lastSeenLabel: null };
  }

  const diffMs = now.getTime() - lastActive.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 0) {
    // Clock skew / future timestamp - treat as online rather than showing
    // a nonsensical "last seen in the future".
    return { isOnline: true, lastSeenLabel: null };
  }

  if (diffMinutes <= ONLINE_THRESHOLD_MINUTES) {
    return { isOnline: true, lastSeenLabel: null };
  }

  return { isOnline: false, lastSeenLabel: formatLastSeen(diffMinutes) };
}

function formatLastSeen(diffMinutes: number): string {
  if (diffMinutes < 60) {
    return `Active ${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Active ${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Active ${diffDays}d ago`;
}
