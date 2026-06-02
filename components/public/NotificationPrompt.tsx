"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, X } from "lucide-react";
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

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const evaluate = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (!("Notification" in window)) return false;
    if (!("serviceWorker" in navigator)) return false;
    if (!("PushManager" in window)) return false;
    if (Notification.permission !== "default") return false;

    const consent = getConsent();
    if (!consent || !consent.notifications) return false;

    const dismissedRaw = localStorage.getItem(DISMISS_KEY);
    if (dismissedRaw) {
      const t = parseInt(dismissedRaw, 10);
      if (!Number.isNaN(t) && Date.now() - t < DISMISS_DAYS * 864e5) return false;
    }
    return true;
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryShow = () => {
      if (evaluate()) setVisible(true);
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
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        dismiss();
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        setBusy(false);
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
      setVisible(false);
    } catch (err) {
      console.error("push subscribe failed", err);
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[55] w-[320px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-black/15 p-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
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
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={dismiss}
          className="flex-1 px-3 py-1.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
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
