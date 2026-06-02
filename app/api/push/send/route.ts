import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushToAll, type PushPayload } from "@/lib/push";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<PushPayload>;
    if (!body.title || !body.body) {
      return NextResponse.json(
        { error: "title and body required" },
        { status: 400 }
      );
    }

    const result = await sendPushToAll({
      title: body.title,
      body: body.body,
      url: body.url,
      image: body.image,
      icon: body.icon,
      badge: body.badge,
      tag: body.tag,
    });

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
