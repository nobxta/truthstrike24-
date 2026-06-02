"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings, Check, X } from "lucide-react";

interface ConsentPrefs {
  analytics: boolean;
  marketing: boolean;
  notifications: boolean;
  version: number;
}

const COOKIE_NAME = "ts_consent";
const SESSION_KEY = "ts_session_id";
const COOKIE_VERSION = 1;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getConsent(): ConsentPrefs | null {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConsentPrefs;
    if (typeof parsed.analytics !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export { getSessionId };

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Respect Do Not Track — treat as reject non-essential
    const dnt =
      typeof navigator !== "undefined" &&
      (navigator.doNotTrack === "1" ||
        (window as unknown as { doNotTrack?: string }).doNotTrack === "1");

    const existing = getConsent();
    if (existing) return;

    if (dnt) {
      // Auto-save a rejected state without showing banner
      const prefs: ConsentPrefs = {
        analytics: false,
        marketing: false,
        notifications: false,
        version: COOKIE_VERSION,
      };
      setCookie(COOKIE_NAME, JSON.stringify(prefs), 365);
      const sid = getSessionId();
      void fetch("/api/cookies/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, ...prefs }),
      }).catch(() => {});
      return;
    }

    // Delay a tick for slide-up animation
    const t = setTimeout(() => {
      setVisible(true);
      setMounted(true);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const save = async (prefs: Omit<ConsentPrefs, "version">) => {
    const full: ConsentPrefs = { ...prefs, version: COOKIE_VERSION };
    setCookie(COOKIE_NAME, JSON.stringify(full), 365);
    const sid = getSessionId();
    try {
      await fetch("/api/cookies/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, ...prefs }),
      });
    } catch {
      /* ignore */
    }
    // Notify same-tab listeners
    window.dispatchEvent(new CustomEvent("ts:consent-updated", { detail: full }));
    setVisible(false);
  };

  const acceptAll = () =>
    save({ analytics: true, marketing: true, notifications: true });
  const rejectAll = () =>
    save({ analytics: false, marketing: false, notifications: false });
  const saveCustom = () => save({ analytics, marketing, notifications });

  if (!mounted && !visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4 transition-all duration-300 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <div className="max-w-[1100px] mx-auto bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 items-center justify-center shrink-0">
              <Cookie size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[14px] font-bold text-gray-900 dark:text-white">
                We value your privacy
              </h2>
              <p className="text-[12px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                We use cookies to keep the site running, measure audience, and
                send breaking-news alerts you opt into. Read our{" "}
                <Link
                  href="/privacy"
                  className="text-accent underline hover:text-red-600 dark:hover:text-red-400"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          {showCustomize && (
            <div className="mt-4 space-y-2 border-t border-gray-100 dark:border-white/[0.06] pt-3">
              <ToggleRow
                label="Essential"
                desc="Required for site to work. Always on."
                checked
                disabled
                onChange={() => {}}
              />
              <ToggleRow
                label="Analytics"
                desc="Anonymous page views to help us improve coverage."
                checked={analytics}
                onChange={setAnalytics}
              />
              <ToggleRow
                label="Marketing"
                desc="Personalized recommendations and campaigns."
                checked={marketing}
                onChange={setMarketing}
              />
              <ToggleRow
                label="Notifications"
                desc="Breaking-news push alerts in your browser."
                checked={notifications}
                onChange={setNotifications}
              />
            </div>
          )}

          <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={rejectAll}
              className="px-3 py-2 text-[12px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Reject non-essential
            </button>
            {showCustomize ? (
              <button
                type="button"
                onClick={saveCustom}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-lg bg-gray-100 dark:bg-white/[0.06] text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
              >
                <Check size={13} />
                Save choices
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-lg bg-gray-100 dark:bg-white/[0.06] text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
              >
                <Settings size={13} />
                Customize
              </button>
            )}
            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <Check size={13} />
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200">
          {label}
        </p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
          {desc}
        </p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked
            ? "bg-emerald-500"
            : "bg-gray-300 dark:bg-white/[0.1]"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
