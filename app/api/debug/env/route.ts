import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-debug-key");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    ANTHROPIC_API_KEY_len: (process.env.ANTHROPIC_API_KEY || "").length,
    ANTHROPIC_API_KEY_prefix: (process.env.ANTHROPIC_API_KEY || "").slice(0, 15),
    OPENAI_API_KEY_len: (process.env.OPENAI_API_KEY || "").length,
    GROQ_API_KEY_len: (process.env.GROQ_API_KEY || "").length,
    WAVESPEED_API_KEY_len: (process.env.WAVESPEED_API_KEY || "").length,
    CRON_SECRET_len: (process.env.CRON_SECRET || "").length,
    DATABASE_URL_len: (process.env.DATABASE_URL || "").length,
    NODE_ENV: process.env.NODE_ENV,
  });
}
