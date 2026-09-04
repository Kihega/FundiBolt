// Uploads the customer's profile photo (picked from the gallery or taken
// as a selfie - see screens/AccountScreen.tsx) to the real backend
// endpoint added alongside this (POST /api/users/me/avatar - see
// code/backend/src/controllers/user.controller.ts and
// src/config/upload.ts for how it's stored).

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export type UploadAvatarResult = {
  success: boolean;
  /** Absolute URL, ready to hand straight to <Avatar uri=.../>. */
  avatarUrl?: string;
  message?: string;
};

/**
 * @param localUri  The file:// (or similar) URI returned by
 *                   expo-image-picker's launchCameraAsync/launchImageLibraryAsync.
 * @param mimeType   e.g. "image/jpeg" - defaults to jpeg since that's what
 *                   the camera and most gallery photos are.
 */
export async function uploadAvatar(token: string, localUri: string, mimeType = "image/jpeg"): Promise<UploadAvatarResult> {
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";

  // React Native's fetch/FormData accepts this { uri, name, type } object
  // form for file fields - it isn't a real Blob/File, but RN's networking
  // layer knows how to stream the file at `uri` from disk.
  const formData = new FormData();
  formData.append("avatar", {
    uri: localUri,
    name: `avatar.${extension}`,
    type: mimeType,
  } as unknown as Blob);

  try {
    const res = await fetch(`${API_URL}/api/users/me/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Deliberately no Content-Type here - fetch sets the correct
        // multipart/form-data boundary itself from the FormData body.
        // Setting it manually breaks the boundary and the upload.
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.message || "Could not upload your photo." };
    }

    // The backend now returns a full, ready-to-use URL (see
    // utils/publicUrl.ts on the backend) - no more manually prefixing
    // API_URL here. That manual prefixing used to only happen on this one
    // response and nowhere else (not on login/signup), which is exactly
    // why a freshly-uploaded photo could show up here but then vanish
    // again after logging back in: the login response's bare relative
    // path was never converted into something <Image> could load. Still
    // defensively handling a relative path below, in case an older
    // backend build (before this fix) responds.
    const returnedUrl: string | undefined = data.avatarUrl;
    const avatarUrl = returnedUrl && returnedUrl.startsWith("/") ? `${API_URL}${returnedUrl}` : returnedUrl;

    return { success: true, avatarUrl };
  } catch (err) {
    console.log("uploadAvatar: request failed", err);
    return { success: false, message: "Network error. Check your connection and try again." };
  }
}
