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

    // Resolve postId — if not provided and pathname looks like article slug, look up
    let postId: string | null = body.postId || null;
    if (!postId) {
      const m = body.pathname.match(/^\/([a-z0-9-]+)$/);
      if (m) {
        const slug = m[1];
        // Skip known top-level routes
        const skip = new Set([
          "about",
          "contact",
          "privacy",
          "terms",
          "search",
          "category",
          "tag",
          "login",
          "dispute",
          "unsubscribe",
          "p",
        ]);
        if (!skip.has(slug)) {
          const post = await prisma.post.findUnique({
            where: { slug },
            select: { id: true },
          });
          if (post) postId = post.id;
        }
      }
    }

    await prisma.postView.create({
      data: {
        postId,
        pathname: body.pathname.slice(0, 500),
        ip,
        country,
        city,
        referer: body.referer ? body.referer.slice(0, 500) : null,
        userAgent: userAgent.slice(0, 500) || null,
        isBot,
        sessionId: body.sessionId || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
