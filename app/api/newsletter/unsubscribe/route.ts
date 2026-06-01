import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/newsletter/unsubscribe?token=xxx
 *
 * Public endpoint — anyone with a valid unsubToken can unsubscribe
 * (the token is a UUID delivered in the welcome email).
 *
 * We DELETE the row entirely so the admin's list stays clean.
 * (Spec said: 'remove the mail from my saved mail ids')
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const sub = await prisma.newsletterSubscriber.findUnique({
      where: { unsubToken: token },
    });
    if (!sub) {
      return NextResponse.json(
        { error: "This unsubscribe link is invalid or already used." },
        { status: 404 }
      );
    }

    await prisma.newsletterSubscriber.delete({ where: { id: sub.id } });

    return NextResponse.json({
      success: true,
      email: sub.email,
      message: "You have been removed from our newsletter list.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
