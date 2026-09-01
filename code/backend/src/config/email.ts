import { Resend } from "resend";
import { env } from "./env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

function otpEmailHtml(code: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color:#0B0A14; padding:40px 16px;">
      <div style="max-width:420px; margin:0 auto; background-color:#17151F; border:1px solid #2A273A; border-radius:16px; padding:36px 28px; text-align:center;">
        <p style="margin:0 0 28px; font-size:24px; font-weight:700; letter-spacing:0.2px;">
          <span style="color:#FFFFFF;">Fundi</span><span style="color:#7C5CFC;">Bolt</span>
        </p>

        <h1 style="margin:0 0 8px; font-size:20px; line-height:28px; color:#FFFFFF; font-weight:600;">
          Verify your email
        </h1>
        <p style="margin:0 0 28px; font-size:14px; line-height:20px; color:#A8A3B8;">
          Use the code below to finish creating your FundiBolt account.
        </p>

        <div style="display:inline-block; padding:16px 28px; background-color:#1F1C2C; border:1px solid #2A273A; border-radius:12px; margin-bottom:28px;">
          <span style="font-size:32px; font-weight:700; letter-spacing:10px; color:#FFFFFF;">${code}</span>
        </div>

        <p style="margin:0 0 6px; font-size:13px; line-height:18px; color:#A8A3B8;">
          This code expires in 5 minutes.
        </p>
        <p style="margin:0; font-size:13px; line-height:18px; color:#6E6980;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>

      <p style="max-width:420px; margin:20px auto 0; text-align:center; font-size:12px; color:#6E6980;">
        FundiBolt &middot; Find trusted local fundis, fast.
      </p>
    </div>
  `;
}

function otpEmailText(code: string): string {
  return [
    "FundiBolt - Verify your email",
    "",
    `Your verification code is: ${code}`,
    "",
    "This code expires in 5 minutes.",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!resend) {
    console.log(`[DEV] RESEND_API_KEY not set - OTP code for ${to}: ${code}`);
    return;
  }

  await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: "Your FundiBolt verification code",
    html: otpEmailHtml(code),
    text: otpEmailText(code),
  });
}
