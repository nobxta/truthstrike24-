"use client";

import { useState, type FormEvent } from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";

interface Props {
  /** Where this widget lives — used for analytics */
  source?: string;
  /** Visual variant */
  variant?: "footer" | "card" | "inline";
  /** Optional custom heading */
  heading?: string;
  /** Optional custom description */
  description?: string;
}

export default function NewsletterSignup({
  source = "footer",
  variant = "footer",
  heading = "Get the news first",
  description = "Subscribe for breaking stories and investigations. No spam — ever.",
}: Props) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        return;
      }
      setStatus("success");
      setMessage(data.message || "Your email has been saved! Check your inbox.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error — please try again");
    }
  };

  /* ── Card variant (boxed, more prominent) ── */
  if (variant === "card") {
    return (
      <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Mail size={20} />
          <h3 className="text-lg sm:text-xl font-bold">{heading}</h3>
        </div>
        <p className="text-sm text-white/85 mb-5">{description}</p>
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <Honeypot value={website} onChange={setWebsite} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={status === "loading" || status === "success"}
            className="flex-1 px-4 py-3 rounded-lg bg-white/15 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 backdrop-blur"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success" || !email.trim()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white text-red-700 hover:bg-red-50 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : status === "success" ? (
              <CheckCircle2 size={14} />
            ) : (
              <Send size={14} />
            )}
            {status === "loading"
              ? "Saving..."
              : status === "success"
              ? "Subscribed"
              : "Subscribe"}
          </button>
        </form>
        {message && (
          <p
            className={`text-xs mt-3 ${
              status === "success" ? "text-white" : "text-red-100"
            }`}
          >
            {status === "success" ? "✓ " : "⚠ "}
            {message}
          </p>
        )}
      </div>
    );
  }

  /* ── Inline variant (one row, transparent bg) ── */
  if (variant === "inline") {
    return (
      <form onSubmit={submit} className="space-y-2">
        <Honeypot value={website} onChange={setWebsite} />
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            disabled={status === "loading" || status === "success"}
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success" || !email.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {status === "loading" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : status === "success" ? (
              <CheckCircle2 size={13} />
            ) : (
              <Send size={13} />
            )}
            {status === "success" ? "Done" : "Join"}
          </button>
        </div>
        {message && (
          <p
            className={`text-[11px] flex items-center gap-1 ${
              status === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {status === "success" ? (
              <CheckCircle2 size={11} />
            ) : (
              <AlertCircle size={11} />
            )}
            {message}
          </p>
        )}
      </form>
    );
  }

  /* ── Footer variant (default, compact, dark theme) ── */
  return (
    <div>
      <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.12em] mb-4 flex items-center gap-1.5">
        <Mail size={11} />
        {heading}
      </h4>
      <p className="text-sm text-gray-500 mb-3 leading-relaxed">{description}</p>
      <form onSubmit={submit} className="space-y-2">
        <Honeypot value={website} onChange={setWebsite} />
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={status === "loading" || status === "success"}
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success" || !email.trim()}
            className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {status === "loading" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : status === "success" ? (
              <CheckCircle2 size={13} />
            ) : (
              <Send size={13} />
            )}
            {status === "success" ? "Sent" : "Subscribe"}
          </button>
        </div>
        {message && (
          <p
            className={`text-[11px] flex items-center gap-1.5 ${
              status === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {status === "success" ? (
              <CheckCircle2 size={11} />
            ) : (
              <AlertCircle size={11} />
            )}
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

/** Invisible honeypot input — bots fill it, humans don't see it. */
function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      name="website"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
    />
  );
}
