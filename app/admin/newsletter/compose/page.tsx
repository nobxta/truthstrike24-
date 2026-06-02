"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Send,
  Loader2,
  Mail,
  TestTube2,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import TopBar from "@/components/admin/TopBar";
import TiptapEditor from "@/components/admin/TiptapEditor";

type FromRole = "news" | "promotion" | "alert";

interface Stats {
  active: number;
}

interface Toast {
  type: "success" | "error";
  text: string;
}

export default function ComposePage() {
  const { data: session } = useSession();
  const adminEmail = session?.user?.email ?? "";

  const [subject, setSubject] = useState("");
  const [preHeader, setPreHeader] = useState("");
  const [html, setHtml] = useState("<p>Write your newsletter here…</p>");
  const [fromRole, setFromRole] = useState<FromRole>("news");
  const [includeLatest, setIncludeLatest] = useState(true);
  const [testMode, setTestMode] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    fetch("/api/newsletter?status=active")
      .then((r) => r.json())
      .then((d) => setStats({ active: d.stats?.active ?? 0 }))
      .catch(() => setStats({ active: 0 }));
  }, []);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 4500);
  }, []);

  const send = useCallback(
    async (isTest: boolean) => {
      setSending(true);
      setConfirmOpen(false);
      try {
        const res = await fetch("/api/newsletter/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            preHeader,
            html,
            fromRole,
            testMode: isTest,
            includeLatestArticles: includeLatest,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast({ type: "error", text: data.error || "Send failed" });
        } else {
          showToast({
            type: "success",
            text: isTest
              ? `Test sent to ${adminEmail}`
              : `Sent to ${data.sentToCount}/${data.totalRecipients} subscribers${
                  data.failedCount > 0 ? ` · ${data.failedCount} failed` : ""
                }`,
          });
        }
      } catch {
        showToast({ type: "error", text: "Network error" });
      } finally {
        setSending(false);
      }
    },
    [subject, preHeader, html, fromRole, includeLatest, adminEmail, showToast]
  );

  const previewSrcDoc = buildPreview({
    subject,
    preHeader,
    bodyHtml: html,
    includeLatest,
  });

  const canSend = subject.trim().length > 0 && html.trim().length > 7;

  return (
    <>
      <TopBar title="Compose Newsletter" />

      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm">
          <div
            className={`flex items-start gap-2 rounded-lg border px-4 py-3 shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.text}</p>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Left: Editor */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Send from
                  </label>
                  <select
                    value={fromRole}
                    onChange={(e) => setFromRole(e.target.value as FromRole)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="news">news@ (Newsletter)</option>
                    <option value="promotion">promotion@ (Marketing)</option>
                    <option value="alert">alert@ (Breaking)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={testMode}
                      onChange={(e) => setTestMode(e.target.checked)}
                      className="rounded border-gray-300 text-navy focus:ring-navy"
                    />
                    Show as test mode
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Your newsletter subject line…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Pre-header (preview text)
                </label>
                <input
                  type="text"
                  value={preHeader}
                  onChange={(e) => setPreHeader(e.target.value)}
                  placeholder="Gray preview text shown in inbox (optional)"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="mb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Body
                </label>
                <TiptapEditor content={html} onChange={setHtml} />
              </div>

              <div className="mt-4 space-y-2 pt-3 border-t border-gray-100">
                <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeLatest}
                    onChange={(e) => setIncludeLatest(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <span>
                    Include link to latest 5 articles automatically
                    <span className="block text-xs text-gray-500">
                      Appends a &ldquo;From the Newsroom&rdquo; block at the bottom.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <Eye size={12} /> Live preview
            </div>
            <div className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
              <iframe
                title="Email preview"
                srcDoc={previewSrcDoc}
                className="w-full h-[700px] bg-white"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>

        {/* Stats + send banner */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Mail size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {stats?.active ?? "…"} active subscribers
              </p>
              <p className="text-xs text-gray-500">
                estimated cost: $0 &middot; sent via {fromRole}@truthstrike24.com
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={!canSend || sending}
              onClick={() => send(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <TestTube2 size={14} />}
              Send Test to Me
            </button>
            <button
              type="button"
              disabled={!canSend || sending || !stats?.active}
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send to All Subscribers
            </button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-red-600" />
                <h3 className="text-base font-bold text-gray-900">Confirm send</h3>
              </div>
              <button
                onClick={() => setConfirmOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700">
                About to send <strong>&ldquo;{subject}&rdquo;</strong> to{" "}
                <strong>{stats?.active ?? 0} people</strong>. Continue?
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => send(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Send now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* Build the preview iframe srcDoc — mirrors lib/newsletter-template.ts */
function buildPreview(args: {
  subject: string;
  preHeader: string;
  bodyHtml: string;
  includeLatest: boolean;
}): string {
  const { subject, preHeader, bodyHtml, includeLatest } = args;
  const year = new Date().getFullYear();
  const latest = includeLatest
    ? `<div style="margin-top:32px;padding-top:24px;border-top:2px solid #dc2626;">
         <h3 style="color:#111827;font-size:16px;font-weight:800;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">From the Newsroom</h3>
         <p style="color:#6b7280;font-size:12px;margin:0 0 12px;">Latest from TruthStrike24</p>
         <div style="padding:14px 0;border-bottom:1px solid #f3f4f6;color:#9ca3af;font-size:13px;font-style:italic;">[Latest 5 published articles will appear here]</div>
       </div>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"/><title>${escapeAttr(subject || "(no subject)")}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;">
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px 12px;">
  <div style="font-size:12px;color:#6b7280;margin-bottom:10px;">
    <strong style="color:#111827;">Subject:</strong> ${escapeAttr(subject || "(no subject)")}
    ${preHeader ? `<br/><span style="color:#9ca3af;">${escapeAttr(preHeader)}</span>` : ""}
  </div>
  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">TruthStrike24</h1>
    <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 6px 0 0; font-weight: 500;">Breaking news, delivered.</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 32px;">
    <div style="color:#1f2937;font-size:15px;line-height:1.65;">${bodyHtml}</div>
    ${latest}
    <div style="border-top: 1px solid #e5e7eb; margin: 28px 0 0; padding-top: 18px;">
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
        Don't want these emails? <a href="#" style="color: #dc2626; text-decoration: underline; font-weight: 600;">Unsubscribe with one click</a>.
      </p>
      <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; margin: 8px 0 0;">
        You're receiving this because you subscribed at truthstrike24.com.
      </p>
    </div>
  </div>
  <p style="text-align: center; font-size: 11px; color: #9ca3af; margin: 18px 0 0;">
    TruthStrike24 &middot; Independent journalism &middot; ${year}
  </p>
</div>
</body></html>`;
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
