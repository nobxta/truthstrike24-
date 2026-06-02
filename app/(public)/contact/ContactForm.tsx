"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrMsg(data.error || "Could not send. Try again.");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrMsg("Network error. Try again.");
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
      <h2 className="text-2xl font-serif font-bold text-navy dark:text-white mb-2">
        Send a Message
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        We read every message. Replies typically within 1&ndash;2 business days.
      </p>

      {status === "success" && (
        <div className="mb-5 flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">
            Thanks — your message reached the newsroom. We&apos;ll be in touch.
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="mb-5 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-red-900 dark:text-red-200">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{errMsg}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        {/* Honeypot — bots fill this; humans never see it */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-950 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-950 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What is this about?"
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-950 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message
          </label>
          <textarea
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message…"
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-950 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="flex items-center gap-2 bg-navy text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {status === "sending" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {status === "sending" ? "Sending…" : "Send Message"}
        </button>
      </form>
    </div>
  );
}
