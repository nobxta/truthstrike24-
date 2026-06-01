import nodemailer from "nodemailer";

/**
 * Email helper with multi-sender support.
 *
 * Authentication is always via SMTP_USER (e.g. admin@truthstrike24.com),
 * but the visible "From" address can be one of several role addresses:
 *
 *   contact@      — general inbound/contact form
 *   news@         — newsletter, article updates
 *   support@      — dispute chats, customer support replies
 *   no-reply@     — automated notifications (default)
 *   alert@        — security/account alerts
 *   promotion@    — marketing/announcements
 *
 * The SMTP server (Spacemail) must have all these aliases set up to forward
 * to the same mailbox, OR allow sending as them from the authenticated account.
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export type SenderRole =
  | "contact"
  | "news"
  | "support"
  | "no-reply"
  | "alert"
  | "promotion";

const ROLE_NAMES: Record<SenderRole, string> = {
  contact: "TruthStrike24 Contact",
  news: "TruthStrike24 News",
  support: "TruthStrike24 Support",
  "no-reply": "TruthStrike24",
  alert: "TruthStrike24 Alert",
  promotion: "TruthStrike24 Updates",
};

/** Domain extracted from SMTP_USER (e.g. "truthstrike24.com" from "admin@truthstrike24.com") */
function getDomain(): string {
  const user = process.env.SMTP_USER || "";
  const at = user.indexOf("@");
  return at >= 0 ? user.slice(at + 1) : "truthstrike24.com";
}

/** Build the "From" header string for a given role */
function fromHeader(role: SenderRole): string {
  const domain = getDomain();
  const address = `${role}@${domain}`;
  const name = ROLE_NAMES[role];
  return `"${name}" <${address}>`;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Which role-based address to send AS (defaults to "no-reply") */
  from?: SenderRole;
  /** If different from "from", set the reply-to header (e.g. for support → reply to support@) */
  replyTo?: SenderRole;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = "no-reply",
  replyTo,
}: SendEmailParams): Promise<boolean> {
  try {
    const domain = getDomain();
    await transporter.sendMail({
      from: fromHeader(from),
      to,
      subject,
      html,
      ...(replyTo && { replyTo: `${replyTo}@${domain}` }),
    });
    return true;
  } catch (error) {
    console.error("[Email Error]", error);
    return false;
  }
}

/* ─── Email templates ─── */

export function disputeCreatedEmail(
  name: string,
  chatUrl: string,
  subject: string
): string {
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
