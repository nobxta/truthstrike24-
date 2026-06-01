import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * GET /api/og?title=...&category=...&date=...&accent=...
 *
 * Generates a 1200x630 branded preview image for articles without a
 * featured image. Used in OG meta as a fallback so link previews still
 * look polished.
 *
 * All params optional. Falls back to brand defaults.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title =
      searchParams.get("title")?.slice(0, 180) ||
      "Breaking news from TruthStrike24";
    const category = searchParams.get("category")?.slice(0, 40) || "NEWS";
    const date = searchParams.get("date") || "";
    const accent = searchParams.get("accent") || "#dc2626";

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px 70px",
            background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
            fontFamily: "sans-serif",
            position: "relative",
            color: "white",
          }}
        >
          {/* Accent line at top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "6px",
              background: `linear-gradient(90deg, ${accent} 0%, #991b1b 50%, ${accent} 100%)`,
            }}
          />

          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "white",
                  letterSpacing: "-1px",
                }}
              >
                TRUTH
              </span>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: accent,
                  letterSpacing: "-1px",
                }}
              >
                STRIKE
              </span>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.4)",
                  marginLeft: "4px",
                }}
              >
                24
              </span>
            </div>

            {/* Category badge */}
            <div
              style={{
                background: accent,
                color: "white",
                padding: "10px 22px",
                borderRadius: 8,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {category}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              maxWidth: "1060px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "5px",
                background: accent,
                borderRadius: 3,
              }}
            />
            <h1
              style={{
                fontSize: title.length > 80 ? 56 : 68,
                fontWeight: 900,
                color: "white",
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: "-1.5px",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Footer row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 24,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 22,
                fontWeight: 500,
              }}
            >
              truthstrike24.com
            </div>
            {date && (
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {date}
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    return new Response(
      `OG generation failed: ${err instanceof Error ? err.message : "unknown"}`,
      { status: 500 }
    );
  }
}
