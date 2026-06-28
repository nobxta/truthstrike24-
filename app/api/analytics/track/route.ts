import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

interface Body {
  pathname?: string;
  postId?: string | null;
  sessionId?: string;
  referer?: string | null;
}

const BOT_RE = /bot|crawler|spider|scraper|preview|fetch|monitor|headless/i;

function getIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.pathname) {
      return NextResponse.json({ error: "pathname required" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const isBot = BOT_RE.test(userAgent);
    const ip = getIp(req);
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      null;
    const city = req.headers.get("x-vercel-ip-city") || null;

    // Skip bots entirely — they generate the bulk of useless analytics writes
    if (isBot) return NextResponse.json({ ok: true, skipped: "bot" });

    // postId resolution removed — saves 1 DB query per page view.
    // Pathname is enough; we can resolve postId in batch later if needed.
    const postId: string | null = body.postId || null;

    try {
      await prisma.postView.create({
        data: {
          postId,
          pathname: body.pathname.slice(0, 500),
          ip,
          country,
          city,
          referer: body.referer ? body.referer.slice(0, 500) : null,
          userAgent: userAgent.slice(0, 500) || null,
          isBot: false,
          sessionId: body.sessionId || null,
        },
      });
    } catch {
      // Best-effort. If DB is at capacity, silently skip — never break the page.
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Outer catch is also best-effort — analytics must NEVER 500
    return NextResponse.json({ ok: true, skipped: "error" });
  }
}
