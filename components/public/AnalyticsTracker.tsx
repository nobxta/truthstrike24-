"use client";

import { useEffect } from "react";
import { getConsent, getSessionId } from "./CookieConsent";

interface Props {
  pathname: string;
  postId?: string | null;
}

const DEDUPE_KEY = "ts_view_dedupe";
const DEDUPE_MS = 30_000;

export default function AnalyticsTracker({ pathname, postId }: Props) {
  useEffect(() => {
    const consent = getConsent();
    if (!consent || !consent.analytics) return;

    // Dedupe — don't fire same path within 30s
    try {
      const raw = sessionStorage.getItem(DEDUPE_KEY);
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      const last = map[pathname];
      if (last && Date.now() - last < DEDUPE_MS) return;
      map[pathname] = Date.now();
      sessionStorage.setItem(DEDUPE_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }

    const sessionId = getSessionId();
    const referer =
      document.referrer && !document.referrer.includes(window.location.host)
        ? document.referrer
        : null;

    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pathname,
        postId: postId || null,
        sessionId,
        referer,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, postId]);

  return null;
}
