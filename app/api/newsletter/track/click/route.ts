import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/newsletter/track/click?c=<campaignId>&e=<email>&u=<encodedUrl>
 *
 * Logs a NewsletterEvent of type "click" then 302-redirects to the original
 * URL. All links in a sent newsletter are rewritten through this endpoint.
 *
 * Only redirects to http/https URLs to prevent open-redirect abuse.
 */

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("c");
  const email = url.searchParams.get("e") || null;
  const target = url.searchParams.get("u");

  let safeTarget = "/";
  if (target) {
    try {
      const decoded = decodeURIComponent(target);
      const parsed = new URL(decoded);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        safeTarget = decoded;
      }
    } catch {
      /* fall through to "/" */
    }
  }

  if (campaignId) {
    try {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      const ua = req.headers.get("user-agent")?.slice(0, 500) ?? null;
      await prisma.newsletterEvent.create({
        data: {
          campaignId,
          type: "click",
          email,
          url: safeTarget,
          ip,
          userAgent: ua,
        },
      });
    } catch {
      /* never block the redirect */
    }
  }

  return NextResponse.redirect(safeTarget, 302);
}
