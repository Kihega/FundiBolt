// Powers TechnicianProfileScreen.tsx - reads/writes the technician-only
// profile fields (specialty, skills, bio, hourlyRate, yearsExperience,
// idDocumentUrl) and their derived qualificationScore. See
// code/backend/src/controllers/user.controller.ts (updateTechnicianProfile,
// uploadIdDocument) and utils/qualification.ts for the scoring rubric.

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export type TechnicianProfileUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  specialty: string | null;
  skills: string[];
  bio: string | null;
  hourlyRate: number | null;
  yearsExperience: number | null;
  idDocumentUrl: string | null;
  qualificationScore: number;
};

export type TechnicianProfileUpdate = {
  specialty?: string;
  skills?: string[];
  bio?: string;
  hourlyRate?: number;
  yearsExperience?: number;
};

export type TechnicianProfileResult = {
  success: boolean;
  user?: TechnicianProfileUser;
  message?: string;
};

export async function updateTechnicianProfile(token: string, update: TechnicianProfileUpdate): Promise<TechnicianProfileResult> {
  try {
    const res = await fetch(`${API_URL}/api/users/me/technician-profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(update),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.message || "Could not update your profile." };
    }
    return { success: true, user: data.user };
  } catch (err) {
    console.log("updateTechnicianProfile: request failed", err);
    return { success: false, message: "Network error. Check your connection and try again." };
  }
}

/**
 * @param localUri  The file:// URI returned by expo-image-picker/expo-document-picker.
 * @param mimeType  e.g. "image/jpeg" or "application/pdf".
 */
export async function uploadIdDocument(token: string, localUri: string, mimeType = "image/jpeg"): Promise<TechnicianProfileResult> {
  const extension = mimeType === "application/pdf" ? "pdf" : mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";

  const formData = new FormData();
  formData.append("document", {
    uri: localUri,
    name: `id-document.${extension}`,
    type: mimeType,
  } as unknown as Blob);

  try {
    const res = await fetch(`${API_URL}/api/users/me/id-document`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // no Content-Type - see services/profile.ts
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.message || "Could not upload your ID document." };
    }
    return { success: true, user: data.user };
  } catch (err) {
    console.log("uploadIdDocument: request failed", err);
    return { success: false, message: "Network error. Check your connection and try again." };
  }
}
