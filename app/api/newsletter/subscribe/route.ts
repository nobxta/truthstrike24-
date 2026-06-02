import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, isHoneypotTripped } from "@/lib/rate-limit";

/**
 * POST /api/newsletter/subscribe
 *
 * Public endpoint — anyone can subscribe.
 * Saves the email to NewsletterSubscriber and sends a welcome email
 * from news@truthstrike24.com.
 *
 * The actual newsletter-sending tooling isn't built yet — this just
 * collects emails. We're letting users know "coming soon" in the welcome email.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function welcomeNewsletterHtml(email: string, unsubUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">TruthStrike24</h1>
        <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 6px 0 0; font-weight: 500;">Breaking news, delivered.</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 36px 32px;">
        <h2 style="color: #111827; font-size: 22px; margin: 0 0 16px; font-weight: 700;">You're on the list!</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 14px;">
          Thanks for subscribing — we've saved <strong style="color: #111827;">${email}</strong> to our newsletter.
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          We're putting the finishing touches on our newsletter system. <strong style="color: #dc2626;">Your first issue will arrive soon.</strong> No spam — just the news that matters, straight from our newsroom.
        </p>
        <div style="background: #fef2f2; border-left: 3px solid #dc2626; padding: 16px 18px; border-radius: 6px; margin: 24px 0;">
          <p style="color: #7f1d1d; font-size: 13px; line-height: 1.5; margin: 0;">
            <strong>Coming soon:</strong> Daily news digest · Investigation alerts · Breaking story notifications
          </p>
        </div>
        <div style="border-top: 1px solid #e5e7eb; margin: 28px 0 0; padding-top: 18px;">
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
            Don't want these emails? <a href="${unsubUrl}" style="color: #dc2626; text-decoration: underline; font-weight: 600;">Unsubscribe with one click</a>.
          </p>
          <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; margin: 8px 0 0;">
            You're receiving this because you subscribed at <a href="https://truthstrike24.com" style="color: #6b7280; text-decoration: none;">truthstrike24.com</a>.<br/>
            Didn't sign up yourself? Click unsubscribe above — we won't bother you again.
          </p>
        </div>
      </div>
      <p style="text-align: center; font-size: 11px; color: #9ca3af; margin: 18px 0 0;">
        TruthStrike24 · Independent journalism · ${new Date().getFullYear()}
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      name?: string;
      source?: string;
      website?: string; // honeypot
    };

    // Honeypot — silent success so bots think it worked
    if (isHoneypotTripped(body.website)) {
      return NextResponse.json({ success: true, message: "Subscribed." });
    }

    // Rate limit: 5 subscribes / hour / IP
    const ipForLimit = getClientIp(req);
    const rl = await checkRateLimit(`newsletter:${ipForLimit}`, 5, 3600);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: `Too many attempts. Try again in ${Math.ceil(rl.resetInSec / 60)} minutes.`,
        },
        { status: 429, headers: { "Retry-After": String(rl.resetInSec) } }
      );
    }

    const email = body.email?.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "unsubscribed") {
        // Reactivate
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { status: "active", name: body.name || existing.name },
        });
        return NextResponse.json({
          success: true,
          alreadySubscribed: false,
          reactivated: true,
          message: "Welcome back! You're subscribed again.",
        });
      }
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: "You're already on the list. Thanks!",
      });
    }

    // Save subscriber
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = req.headers.get("user-agent")?.slice(0, 500) ?? null;

    const sub = await prisma.newsletterSubscriber.create({
      data: {
        email,
        name: body.name?.trim() || null,
        source: body.source || "footer",
        ipAddress: ip,
        userAgent: ua,
      },
    });

    // Build the public unsubscribe URL using the per-subscriber token
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `https://${req.headers.get("host") || "truthstrike24.vercel.app"}`;
    const unsubUrl = `${siteUrl}/unsubscribe/${sub.unsubToken}`;

    // Send welcome email — AWAIT so we know if SMTP failed
    let emailSent = false;
    let emailError: string | null = null;
    try {
      emailSent = await sendEmail({
        to: email,
        subject: "You're subscribed to TruthStrike24",
        html: welcomeNewsletterHtml(email, unsubUrl),
        from: "news",
        replyTo: "news",
      });
      if (!emailSent) {
        emailError = "Email service did not deliver. Your subscription is saved.";
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Email send failed";
      console.error("[newsletter welcome email]", err);
    }

    return NextResponse.json({
      success: true,
      alreadySubscribed: false,
      reactivated: false,
      subscriberId: sub.id,
      emailSent,
      emailError,
      message: emailSent
        ? "Saved! Check your inbox for confirmation."
        : "Subscription saved, but we couldn't send the confirmation email right now. You're still on the list.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
