"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, X, Share, Plus, Home } from "lucide-react";
import { getConsent, getSessionId } from "./CookieConsent";

const DISMISS_KEY = "ts_notif_dismissed_at";
const DISMISS_DAYS = 7;
const SHOW_AFTER_MS = 30_000;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

/* ─── iOS detection ─── */

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari uses navigator.standalone, other browsers use display-mode media query
  return (
    (navigator as NavigatorWithStandalone).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/** True if iOS Safari and the user hasn't added to home screen yet. */
function isIosNeedsInstall(): boolean {
  return isIos() && !isStandalonePWA();
}

/** True if the browser supports the Notification + Push APIs */
function browserSupportsPush(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(() => {
    if (typeof window === "undefined") return false;

    const consent = getConsent();
    if (!consent || !consent.notifications) return false;

    const dismissedRaw = localStorage.getItem(DISMISS_KEY);
    if (dismissedRaw) {
      const t = parseInt(dismissedRaw, 10);
      if (!Number.isNaN(t) && Date.now() - t < DISMISS_DAYS * 864e5) return false;
    }

    // Special iOS case: show install banner if iOS Safari not yet PWA
    if (isIosNeedsInstall()) {
      return true;
    }

    if (!browserSupportsPush()) return false;
    if (Notification.permission !== "default") return false;

    return true;
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryShow = () => {
      if (evaluate()) {
        // Decide which mode to show: install banner or allow banner
        setIosMode(isIosNeedsInstall());
        setVisible(true);
      }
    };

    timer = setTimeout(tryShow, SHOW_AFTER_MS);

    const onConsent = () => {
      if (evaluate()) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(tryShow, 2000);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("ts:consent-updated", onConsent);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("ts:consent-updated", onConsent);
    };
  }, [evaluate]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const allow = async () => {
    setBusy(true);
    setError(null);

    // ALWAYS hide the banner immediately, regardless of what happens next.
    // The user took action — don't show this card again.
    // (Subscription happens in background; failures get logged.)
    const closeBanner = () => {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      setVisible(false);
    };

    try {
      if (!browserSupportsPush()) {
        setError("Your browser doesn't support push notifications yet.");
        setTimeout(closeBanner, 3000);
        return;
      }

      // Request permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        // User denied or dismissed the OS prompt — close our banner
        closeBanner();
        return;
      }

      // Permission granted — close our banner now (subscription is background work)
      closeBanner();

      // Continue subscribing in background (no UI dependency)
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapid) {
          console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
          return;
        }
        const key = urlBase64ToUint8Array(vapid);
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key.buffer.slice(
            key.byteOffset,
            key.byteOffset + key.byteLength
          ) as ArrayBuffer,
        });
        const json = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: getSessionId(),
            subscription: json,
          }),
        });
      } catch (subErr) {
        console.error("[push] background subscribe failed", subErr);
      }
    } catch (err) {
      console.error("[push] allow failed", err);
      closeBanner();
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  /* ── iOS Safari needs PWA install first ── */
  if (iosMode) {
    return (
      <div
        className="fixed bottom-4 right-4 left-4 sm:left-auto z-[55] sm:w-[340px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-black/15 p-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
        role="dialog"
        aria-label="Enable notifications on iOS"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <Bell size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[13px] font-bold text-gray-900 dark:text-white">
              Get notifications on iPhone
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
              Tap <strong>Share</strong> below, then <strong>Add to Home Screen</strong>. Open
              the app from your home screen to enable alerts.
            </p>
          </div>
        </div>

        {/* iOS install steps */}
        <div className="mt-3 space-y-2 bg-gray-50 dark:bg-white/[0.02] rounded-lg p-2.5 border border-gray-100 dark:border-white/[0.05]">
          <div className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-300">
            <Share size={12} className="text-blue-600 shrink-0" />
            <span>
              1. Tap the <strong>Share</strong> icon (bottom of Safari)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-300">
            <Plus size={12} className="text-blue-600 shrink-0" />
            <span>
              2. Scroll down → tap <strong>Add to Home Screen</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-300">
            <Home size={12} className="text-blue-600 shrink-0" />
            <span>3. Open the app from your Home Screen</span>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="w-full mt-3 px-3 py-1.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          Got it
        </button>
      </div>
    );
  }

  /* ── Standard allow banner (all other browsers + iOS in standalone mode) ── */
  return (
    <div
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-[55] sm:w-[320px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-black/15 p-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
      role="dialog"
      aria-label="Enable notifications"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition-colors"
        aria-label="Close"
      >
        <X size={14} />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[13px] font-bold text-gray-900 dark:text-white">
            Get breaking news alerts
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
            Be the first to know — instant browser notifications, no spam.
          </p>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={dismiss}
          disabled={busy}
          className="flex-1 px-3 py-1.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={allow}
          disabled={busy}
          className="flex-1 px-3 py-1.5 text-[12px] font-bold text-white bg-accent rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {busy ? "Enabling..." : "Allow"}
        </button>
      </div>
    </div>
  );
}
