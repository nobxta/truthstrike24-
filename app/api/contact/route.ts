import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, isHoneypotTripped } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  website?: string; // honeypot
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactBody;

    if (isHoneypotTripped(body.website)) {
      return NextResponse.json({ success: true });
    }

    const ipForLimit = getClientIp(req);
    const rl = await checkRateLimit(`contact:${ipForLimit}`, 5, 3600);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: `Too many messages. Try again in ${Math.ceil(rl.resetInSec / 60)} minutes.`,
        },
        { status: 429, headers: { "Retry-After": String(rl.resetInSec) } }
      );
    }

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }
    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long (5000 char max)" },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 800;">New Contact Form Message</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 28px;">
          <p style="margin:0 0 16px;"><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
          <p style="margin:0 0 16px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p style="margin:0 0 8px;"><strong>Message:</strong></p>
          <div style="background:#f9fafb;border-left:3px solid #dc2626;padding:14px 16px;border-radius:6px;color:#1f2937;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
          <p style="margin:18px 0 0;font-size:11px;color:#9ca3af;">IP: ${escapeHtml(ip)}</p>
        </div>
      </div>
    `;

    const adminTo =
      process.env.CONTACT_FORM_INBOX || "admin@truthstrike24.com";

    const ok = await sendEmail({
      to: adminTo,
      subject: `[Contact] ${subject}`,
      html,
      from: "support",
      replyTo: "contact",
    });

    if (!ok) {
      return NextResponse.json(
        { error: "Could not send message right now. Try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
