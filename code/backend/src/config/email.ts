import { Resend } from "resend";
import { env } from "./env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!resend) {
    console.log(`[DEV] RESEND_API_KEY not set - OTP code for ${to}: ${code}`);
    return;
  }

  await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: "Your FundiBolt verification code",
    html: `
      <p>Your verification code is:</p>
      <h2 style="letter-spacing: 4px;">${code}</h2>
      <p>This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
