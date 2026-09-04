import crypto from "crypto";

// Used for the "forgot password" flow (see auth.controller.ts:
// forgotPassword). Alphanumeric rather than digits-only like the OTP code
// (utils/otp.ts), since this becomes the user's actual password until
// they change it - a plain 6-digit PIN would be too weak for that.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // no 0/O/1/I/l - avoids visual ambiguity in the email

export function generateTempPassword(length = 10): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
}
