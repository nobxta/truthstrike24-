import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"TruthStrike24" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Email Error]", error);
    return false;
  }
}

export function disputeCreatedEmail(name: string, chatUrl: string, subject: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #d4d4d4;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">TruthStrike24</h1>
        <p style="color: #888; font-size: 13px; margin-top: 4px;">Dispute Report System</p>
      </div>
      <div style="background: #141414; border: 1px solid #222; border-radius: 12px; padding: 32px;">
        <p style="margin-top: 0;">Hi <strong style="color: #fff;">${name}</strong>,</p>
        <p>Your dispute report regarding <strong style="color: #fff;">"${subject}"</strong> has been received.</p>
        <p>You can view and respond to your case using the link below. <strong style="color: #ef4444;">Save this link</strong> — it's the only way to access your chat.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${chatUrl}" style="display: inline-block; padding: 14px 32px; background: #ef4444; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Open Your Chat</a>
        </div>
        <p style="font-size: 13px; color: #666;">If the button doesn't work, copy this link:<br/>
        <a href="${chatUrl}" style="color: #ef4444; word-break: break-all;">${chatUrl}</a></p>
      </div>
      <p style="text-align: center; font-size: 11px; color: #555; margin-top: 24px;">Do not share this link. It provides direct access to your dispute chat.</p>
    </div>
  `;
}

export function adminRepliedEmail(name: string, chatUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #d4d4d4;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">TruthStrike24</h1>
        <p style="color: #888; font-size: 13px; margin-top: 4px;">Dispute Report System</p>
      </div>
      <div style="background: #141414; border: 1px solid #222; border-radius: 12px; padding: 32px;">
        <p style="margin-top: 0;">Hi <strong style="color: #fff;">${name}</strong>,</p>
        <p>You have a new reply on your dispute report. Click below to view the conversation.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${chatUrl}" style="display: inline-block; padding: 14px 32px; background: #ef4444; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">View Reply</a>
        </div>
        <p style="font-size: 13px; color: #666;">If the button doesn't work, copy this link:<br/>
        <a href="${chatUrl}" style="color: #ef4444; word-break: break-all;">${chatUrl}</a></p>
      </div>
      <p style="text-align: center; font-size: 11px; color: #555; margin-top: 24px;">Do not share this link. It provides direct access to your dispute chat.</p>
    </div>
  `;
}
