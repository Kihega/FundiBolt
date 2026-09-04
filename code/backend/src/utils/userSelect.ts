// Shared "safe to send to the client" field selection for anything that
// returns a user object - signup (on OTP completion), login, GET /me, and
// avatar upload all return exactly this shape, matching what AuthUser
// (mobile: src/types/user.ts) expects. Centralized here instead of each
// controller defining its own copy, so they can't quietly drift apart.
export const PUBLIC_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  emailVerified: true,
  avatarUrl: true,
  lastActiveAt: true,
} as const;
