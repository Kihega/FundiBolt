// Pure password-strength scoring logic, extracted from PasswordStrengthMeter
// so it can be unit tested without rendering React Native components.

// A short blocklist of extremely common / breached passwords. Any password
// that matches (case-insensitively) is always scored as the weakest tier,
// regardless of length or character variety - this mirrors real-world
// password strength guidance (NIST 800-63B), which weighs "is this a known
// weak/common password" more heavily than raw character-class complexity.
export const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "123456", "12345678",
  "123456789", "1234567890", "qwerty", "qwerty123", "111111", "123123",
  "abc123", "letmein", "iloveyou", "admin", "welcome", "monkey", "dragon",
  "football", "baseball", "sunshine", "princess", "trustno1", "changeme",
]);

// Runs of 3+ identical characters ("aaa", "111") or short keyboard/alphabet
// sequences ("1234", "abcd", "qwer") make a password easy to guess even if
// it technically satisfies length/character-class rules.
const REPEATED_RUN = /(.)\1{2,}/;
const SEQUENTIAL_RUN = /(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210|abcd|bcde|cdef|defg|qwer|wert|asdf|sdfg|zxcv)/i;

export const PASSWORD_STRENGTH_LABELS = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

export function getPasswordStrength(password: string): number {
  if (password.length < 6) return 0;
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return 0;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (REPEATED_RUN.test(password) || SEQUENTIAL_RUN.test(password)) {
    score = Math.max(0, score - 2);
  }

  return Math.max(0, Math.min(score, 4)); // 0-4
}
