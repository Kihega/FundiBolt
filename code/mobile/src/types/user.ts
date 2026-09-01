// Shared shape for the authenticated user, mirrored from the backend's
// login/signup response (see code/backend/src/controllers/auth.controller.ts).
//
// "fundi" is the backend's role value for technicians - the UI-facing label
// is "Technician". Keeping the raw backend value here (rather than remapping
// it) avoids a translation layer that could drift out of sync with the API.
export type UserRole = "customer" | "fundi" | "admin";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl?: string | null;
  // ISO 8601 timestamp of the user's last known activity. Not yet returned
  // by the backend (no presence tracking exists there yet) - optional so
  // the UI degrades to "offline" until that lands.
  lastActiveAt?: string | null;
};
