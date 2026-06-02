import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/newsletter/track/open?c=<campaignId>&e=<email>
 *
 * Returns a 1×1 transparent GIF and logs a NewsletterEvent of type "open".
 * Embedded in every sent newsletter as <img src=... width=1 height=1 />.
 * Email clients fetch this when the message is viewed.
 */

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("c");
  const email = url.searchParams.get("e") || null;

  if (campaignId) {
    try {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      const ua = req.headers.get("user-agent")?.slice(0, 500) ?? null;
      await prisma.newsletterEvent.create({
        data: { campaignId, type: "open", email, ip, userAgent: ua },
      });
    } catch {
      /* never fail the pixel */
    }
  }

  return new NextResponse(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    },
  });
}
