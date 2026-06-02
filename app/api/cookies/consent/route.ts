import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

interface Body {
  sessionId?: string;
  analytics?: boolean;
  marketing?: boolean;
  notifications?: boolean;
}

function getIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

function getCountry(req: NextRequest): string | null {
  return (
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const analytics = !!body.analytics;
    const marketing = !!body.marketing;
    const notifications = !!body.notifications;

    const ip = getIp(req);
    const country = getCountry(req);
    const userAgent = req.headers.get("user-agent") || null;

    await prisma.cookieConsent.upsert({
      where: { sessionId },
      create: {
        sessionId,
        ip,
        country,
        analytics,
        marketing,
        notifications,
        userAgent,
      },
      update: {
        analytics,
        marketing,
        notifications,
        ip,
        country,
        userAgent,
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
