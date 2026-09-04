import { env } from "../config/env";

// Turns the relative path stored in User.avatarUrl (e.g.
// "/uploads/avatars/<file>" - see config/upload.ts) into a full URL the
// mobile app can hand straight to <Image source={{ uri }} />.
//
// Every endpoint that returns a user object (signup, login, GET /me,
// avatar upload) runs its result through withAbsoluteAvatarUrl below
// before responding, so the mobile client never has to know or remember
// to do this prefixing itself - getting this wrong (or only doing it in
// one place) is exactly what caused avatars to silently fail to load
// after login even though the upload itself had "worked".
export function toAbsoluteAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl; // already absolute
  return `${env.publicApiUrl}${avatarUrl}`;
}

export function withAbsoluteAvatarUrl<T extends { avatarUrl: string | null }>(user: T): T {
  return { ...user, avatarUrl: toAbsoluteAvatarUrl(user.avatarUrl) };
}
