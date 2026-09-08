import crypto from "crypto";

// crypto.randomInt is a CSPRNG (cryptographically secure pseudo-random
// number generator) - Math.random() is explicitly documented as NOT
// suitable for anything security-sensitive (its output can, in
// principle, be predicted by observing enough samples). An OTP code
// gates account verification, so it belongs in the same "must be
// unpredictable" category as generateTempPassword (utils/tempPassword.ts),
// which already correctly uses crypto.randomBytes for the same reason.
export function generateOtp(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}
