import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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

function welcomeNewsletterHtml(email: string): string {
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
        <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 24px 0 0;">
          You're receiving this because you subscribed at <a href="https://truthstrike24.com" style="color: #dc2626; text-decoration: none;">truthstrike24.com</a>.<br/>
          Didn't sign up? Just ignore this email — we won't send anything else without your consent.
        </p>
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
    };

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

    // Send welcome email (don't block the response if it fails)
    sendEmail({
      to: email,
      subject: "You're subscribed to TruthStrike24",
      html: welcomeNewsletterHtml(email),
      from: "news",
      replyTo: "news",
    }).catch((e) => console.error("[newsletter welcome email]", e));

    return NextResponse.json({
      success: true,
      alreadySubscribed: false,
      reactivated: false,
      subscriberId: sub.id,
      message: "Saved! Check your inbox for confirmation.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
