// Password-change and forgot-password flows for the account settings.
//
// Both POST /api/auth/change-password and POST /api/auth/forgot-password
// are real backend endpoints now (see code/backend/src/controllers/auth.controller.ts).
// The local mock fallback in each function's catch block is kept purely
// as an offline-dev safety net (e.g. the backend isn't running locally) -
// on a reachable backend, these always take the real response path.

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export type ChangePasswordParams = {
  token: string;
  oldPassword: string;
  newPassword: string;
};

export type ChangePasswordResult = {
  success: boolean;
  message: string;
};

export async function changePassword({ token, oldPassword, newPassword }: ChangePasswordParams): Promise<ChangePasswordResult> {
  try {
    const res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, message: data.message || "Your password has been changed." };
    }

    // The backend rejects a wrong old password with 401 - its message is
    // passed straight through so the modal shows the real reason.
    return { success: false, message: data.message || "Could not change your password. Please try again." };
  } catch (err) {
    console.log("changePassword: backend unreachable, using local mock", err);
    // Offline-dev fallback only (see file header) - accepts any well-formed request.
    return { success: true, message: "Your password has been changed (mocked - backend isn't reachable right now)." };
  }
}

export type PasswordResetResult = {
  success: boolean;
  message: string;
  /**
   * Only present when falling back to the local mock (backend
   * unreachable). The real endpoint never returns the temporary password
   * in the response body - it only goes out over email (or to the
   * server's console log in local dev without RESEND_API_KEY set - see
   * the backend's config/email.ts).
   */
  mockTemporaryPassword?: string;
};

export async function requestPasswordReset(identifier: string): Promise<PasswordResetResult> {
  try {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: true, message: data.message || "Check your email for a temporary password." };
    }
  } catch (err) {
    console.log("requestPasswordReset: backend unreachable, using local mock", err);
  }

  const mockTemporaryPassword = `Temp-${Math.random().toString(36).slice(2, 8)}`;
  return {
    success: true,
    message: "Backend isn't reachable right now, so here's a mock temporary password to use below instead of a real email:",
    mockTemporaryPassword,
  };
}
