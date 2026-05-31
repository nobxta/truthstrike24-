"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  MessageSquare,
  Loader2,
  Save,
  Power,
  PowerOff,
  Clock,
  Sparkles,
  Info,
  CheckCircle,
  Zap,
  BarChart3,
  DollarSign,
  Activity,
  Hash,
  AlertTriangle,
  TrendingUp,
  Play,
  ExternalLink,
  XCircle,
} from "lucide-react";
import TopBar from "@/components/admin/TopBar";
import { PROVIDER_MODELS } from "@/lib/ai-providers";

type Provider = "anthropic" | "openai" | "groq";

interface Settings {
  model: string;
  enabled: boolean;
  topicFocus: string;
  postProvider: string;
  chatProvider: string;
  chatModel: string;
  imageModel: string;
  watermarkUrl: string;
  useWebSearch: boolean;
  wordLimit: number;
  writingStyle: string;
  postIntervalMinutes: number;
  autoReplyEnabled: boolean;
  autoReplyMinutes: number;
}

interface UsageData {
  totals: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    failedCalls: number;
  };
  byPurpose: { purpose: string; calls: number; tokens: number; cost: number }[];
  byProvider: { provider: string; calls: number; tokens: number; cost: number }[];
  byModel: { model: string; calls: number; tokens: number; cost: number }[];
  recentCalls: {
    id: string;
    provider: string;
    model: string;
    purpose: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    durationMs: number;
    success: boolean;
    error: string | null;
    createdAt: string;
  }[];
}

const DEFAULT: Settings = {
  model: "llama-3.3-70b-versatile",
  enabled: true,
  topicFocus: "Indian news, politics, sports, tech, entertainment",
  postProvider: "groq",
  chatProvider: "groq",
  chatModel: "llama-3.3-70b-versatile",
  imageModel: "wavespeed-ai/flux-schnell",
  watermarkUrl: "",
  useWebSearch: false,
  wordLimit: 600,
  writingStyle: "Professional journalism with specific names, dates, statistics, and quotes from real people. No filler.",
  postIntervalMinutes: 60,
  autoReplyEnabled: true,
  autoReplyMinutes: 60,
};

/* Model speed/quality reference for UI hints */
const MODEL_SPEED_GUIDE = [
  { id: "llama-3.3-70b-versatile", provider: "groq", tps: 500, quality: 4, sec: 5, badge: "FAST + GOOD", color: "emerald" },
  { id: "llama-3.1-8b-instant", provider: "groq", tps: 750, quality: 3, sec: 3, badge: "FASTEST", color: "cyan" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", provider: "groq", tps: 600, quality: 4, sec: 4, badge: "FAST + NEW", color: "blue" },
  { id: "claude-sonnet-4-5-20250929", provider: "anthropic", tps: 50, quality: 5, sec: 20, badge: "BEST QUALITY (slow)", color: "violet" },
  { id: "claude-sonnet-4-6", provider: "anthropic", tps: 50, quality: 5, sec: 20, badge: "BEST QUALITY (slow)", color: "violet" },
  { id: "gpt-4o-mini", provider: "openai", tps: 100, quality: 5, sec: 11, badge: "QUALITY + CHEAP", color: "amber" },
  { id: "gpt-4o", provider: "openai", tps: 80, quality: 5, sec: 13, badge: "PREMIUM (slow)", color: "amber" },
];

/* ── Helpers ── */

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtCost(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.001) return `$${n.toFixed(6)}`;
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function purposeLabel(p: string): string {
  switch (p) {
    case "post": return "Article Gen";
    case "chat_enhance": return "Chat Enhance";
    case "auto_reply": return "Auto Reply";
    default: return p;
  }
}

function purposeColor(p: string): string {
  switch (p) {
    case "post": return "bg-orange-100 text-orange-700";
    case "chat_enhance": return "bg-violet-100 text-violet-700";
    case "auto_reply": return "bg-amber-100 text-amber-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Styled Select ── */

function SSelect({
  label, value, onChange, options, help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; desc?: string }[];
  help?: string;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}{o.desc ? ` — ${o.desc}` : ""}
          </option>
        ))}
      </select>
      {help && <p className="text-[11px] text-gray-400 mt-1">{help}</p>}
    </div>
  );
}

/* ── Page ── */

interface AgentLogEntry {
  id: string;
  timestamp: string;
  model: string;
  status: string;
  title: string | null;
  error: string | null;
}

interface RunResult {
  success?: boolean;
  post?: { id: string; title: string; slug: string; url: string };
  topic?: string;
  provider?: string;
  model?: string;
  error?: string;
  raw?: string;
}

export default function AgentSettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULT);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const load = useCallback(async () => {
    try {
      const [sRes, uRes, lRes] = await Promise.all([
        fetch("/api/agent/settings"),
        fetch("/api/ai/usage"),
        fetch("/api/agent/post"),
      ]);
      if (sRes.ok) setS(await sRes.json());
      if (uRes.ok) setUsage(await uRes.json());
      if (lRes.ok) {
        const data = await lRes.json();
        setLogs(data.logs || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const runAgent = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const r = await fetch("/api/agent/post", { method: "POST" });
      const data: RunResult = await r.json();
      setRunResult(data);
      // Refresh logs and usage
      const [uRes, lRes] = await Promise.all([
        fetch("/api/ai/usage"),
        fetch("/api/agent/post"),
      ]);
      if (uRes.ok) setUsage(await uRes.json());
      if (lRes.ok) {
        const ld = await lRes.json();
        setLogs(ld.logs || []);
      }
    } catch (e) {
      setRunResult({ error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const r = await fetch("/api/agent/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s),
      });
      if (r.ok) { setS(await r.json()); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const up = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setPostProv = (p: Provider) => { up("postProvider", p); up("model", PROVIDER_MODELS[p].models[0]?.id ?? ""); };
  const setChatProv = (p: Provider) => { up("chatProvider", p); up("chatModel", PROVIDER_MODELS[p].models[0]?.id ?? ""); };

  if (loading) {
    return (
      <>
        <TopBar title="AI Agent Settings" />
        <div className="flex items-center justify-center p-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  const pp = s.postProvider as Provider;
  const cp = s.chatProvider as Provider;
  const u = usage;

  const speedInfo = MODEL_SPEED_GUIDE.find((m) => m.id === s.model);
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    violet: "bg-violet-50 border-violet-200 text-violet-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };

  return (
    <>
      <TopBar title="AI Agent Settings" />
      <div className="p-4 sm:p-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* ═══ LEFT: Settings ═══ */}
          <div className="flex-1 min-w-0 space-y-6 max-w-2xl">
            {/* News Article Agent */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Bot size={18} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[14px] font-bold text-gray-900">News Article Agent</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Auto-generates and publishes news articles</p>
                </div>
                <button onClick={() => up("enabled", !s.enabled)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all ${
                    s.enabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}>
                  {s.enabled ? <Power size={11} /> : <PowerOff size={11} />}
                  {s.enabled ? "Active" : "Off"}
                </button>
              </div>
              <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100/50">
                <div className="flex items-start gap-2">
                  <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    <strong>How it works:</strong> When enabled, AI writes news articles based on your Topic Focus using the selected model. Runs on cron schedule.
                  </p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <SSelect label="AI Provider" value={pp} onChange={(v) => setPostProv(v as Provider)}
                  options={Object.entries(PROVIDER_MODELS).map(([k, v]) => ({ value: k, label: v.label }))}
                  help="Which AI generates your articles" />
                <SSelect label="Model" value={s.model} onChange={(v) => up("model", v)}
                  options={PROVIDER_MODELS[pp].models.map((m) => ({ value: m.id, label: m.name, desc: m.desc }))}
                  help="Bigger models = better quality but slower" />

                {/* Speed/Quality estimate for selected model */}
                {speedInfo && (
                  <div className={`rounded-lg border p-3 ${colorMap[speedInfo.color]}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{speedInfo.badge}</span>
                      <span className="text-[11px] font-mono">{speedInfo.tps} tok/s</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span>Est. <strong>~{speedInfo.sec}s</strong> for {s.wordLimit}-word article</span>
                      <span>Quality: {"★".repeat(speedInfo.quality)}{"☆".repeat(5 - speedInfo.quality)}</span>
                    </div>
                    {speedInfo.sec > 9 && (
                      <p className="text-[10px] mt-1.5 opacity-80">⚠ May exceed Vercel Hobby 10s — needs Pro or vercel.json maxDuration</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Topic Focus</label>
                  <textarea value={s.topicFocus} onChange={(e) => up("topicFocus", e.target.value)} rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none placeholder-gray-400"
                    placeholder="e.g. Indian news, crypto scams..." />
                  <p className="text-[11px] text-gray-400 mt-1">AI writes about these topics. Separate with commas.</p>
                </div>

                {/* Word limit */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">
                    Word Limit <span className="text-gray-400 font-normal">— target article length</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={200} max={1500} step={50} value={s.wordLimit}
                      onChange={(e) => up("wordLimit", parseInt(e.target.value, 10))}
                      className="flex-1 accent-blue-500" />
                    <span className="w-16 text-center text-sm font-bold text-gray-900 bg-gray-100 rounded px-2 py-1">{s.wordLimit}w</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>200 (brief)</span>
                    <span>600 (standard)</span>
                    <span>1000+ (long-read)</span>
                  </div>
                </div>

                {/* Posting interval */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">
                    Posting Interval <span className="text-gray-400 font-normal">— how often a new article is generated</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={5} max={360} step={5} value={s.postIntervalMinutes}
                      onChange={(e) => up("postIntervalMinutes", parseInt(e.target.value, 10))}
                      className="flex-1 accent-orange-500" />
                    <span className="w-20 text-center text-sm font-bold text-gray-900 bg-gray-100 rounded px-2 py-1">
                      {s.postIntervalMinutes < 60
                        ? `${s.postIntervalMinutes}min`
                        : s.postIntervalMinutes === 60
                        ? "1hr"
                        : `${(s.postIntervalMinutes / 60).toFixed(1)}hr`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>5 min (rapid)</span>
                    <span>1 hour (standard)</span>
                    <span>6 hours (slow)</span>
                  </div>
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                    💡 <strong>VPS worker reads this from the database on every cycle.</strong> Change it here → applies immediately on the next interval (no restart needed). Toggle &quot;Active&quot; OFF above to pause posting completely.
                  </p>
                </div>

                {/* Web search toggle */}
                <div className="flex items-start justify-between gap-3 py-1">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-800">Web search (real news)</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ON: Claude searches the web for real news. <strong>Adds 15-25s.</strong> Anthropic only.
                      <br />OFF: AI writes from knowledge cutoff. Fits Vercel Hobby 10s.
                    </p>
                  </div>
                  <button onClick={() => up("useWebSearch", !s.useWebSearch)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${s.useWebSearch ? "bg-emerald-500" : "bg-gray-300"}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${s.useWebSearch ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {/* Writing style */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Writing Style Instructions</label>
                  <textarea value={s.writingStyle} onChange={(e) => up("writingStyle", e.target.value)} rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none placeholder-gray-400"
                    placeholder="Professional journalism with named sources, statistics, quotes..." />
                  <p className="text-[11px] text-gray-400 mt-1">Tells the AI HOW to write. Be specific — &quot;include named people, exact stats, direct quotes&quot; produces better content than &quot;professional tone&quot;.</p>
                </div>

                {/* Image model */}
                <SSelect label="Image Model (WaveSpeed.ai)" value={s.imageModel} onChange={(v) => up("imageModel", v)}
                  options={[
                    { value: "wavespeed-ai/flux-schnell", label: "FLUX schnell", desc: "Fastest (~4s), great quality" },
                    { value: "wavespeed-ai/flux-dev", label: "FLUX dev", desc: "Best balance (~20s)" },
                    { value: "wavespeed-ai/flux-dev-ultra-fast", label: "FLUX dev ultra-fast", desc: "Optimized (~10s)" },
                    { value: "wavespeed-ai/flux-kontext-pro", label: "FLUX Kontext Pro", desc: "Image editing + reference" },
                    { value: "wavespeed-ai/flux-kontext-max", label: "FLUX Kontext Max", desc: "Highest quality + reference" },
                    { value: "wavespeed-ai/hidream-i1-full", label: "HiDream-I1", desc: "Premium quality (slow)" },
                    { value: "wavespeed-ai/sdxl-lightning", label: "SDXL Lightning", desc: "Stable Diffusion (fast)" },
                  ]}
                  help="Schnell = fast 4-step model. Kontext models can use a reference image." />

                <div>
                  <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Brand Watermark URL (optional)</label>
                  <input type="url" value={s.watermarkUrl} onChange={(e) => up("watermarkUrl", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder-gray-400"
                    placeholder="https://res.cloudinary.com/.../logo.png" />
                  <p className="text-[11px] text-gray-400 mt-1">Used by Kontext models as reference. Leave blank to skip.</p>
                </div>

                {/* ── Test: Generate Now ── */}
                <div className="border-t border-gray-100 pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-gray-800">Test the agent</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Run once now to verify it&apos;s working</p>
                    </div>
                    <button
                      onClick={runAgent}
                      disabled={running || !s.enabled}
                      className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                      {running ? "Generating..." : "Generate Now"}
                    </button>
                  </div>

                  {/* Result */}
                  {runResult && (
                    <div className={`rounded-lg p-3 text-[12px] border ${
                      runResult.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}>
                      {runResult.success && runResult.post ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                            <span className="font-bold">Article published successfully!</span>
                          </div>
                          <p className="ml-6"><strong>Title:</strong> {runResult.post.title}</p>
                          <p className="ml-6"><strong>Topic:</strong> {runResult.topic}</p>
                          <p className="ml-6"><strong>Model:</strong> {runResult.provider} / {runResult.model}</p>
                          <a
                            href={runResult.post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-6 inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline font-semibold"
                          >
                            View Article <ExternalLink size={11} />
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <XCircle size={14} className="text-red-500 shrink-0" />
                            <span className="font-bold">Failed: {runResult.error}</span>
                          </div>
                          {runResult.raw && (
                            <pre className="ml-6 text-[10px] bg-white/50 rounded p-2 overflow-x-auto">
                              {runResult.raw}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent runs */}
                  {logs.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Recent Runs ({logs.length})
                        </p>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {logs.map((log) => (
                          <div key={log.id} className="px-3 py-2 border-t border-gray-50 first:border-t-0 flex items-start gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                              log.status === "success" ? "bg-emerald-400" : "bg-red-400"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-gray-800 truncate">
                                {log.title || log.error || "(no title)"}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {log.model} · {new Date(log.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Support Chat AI */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <MessageSquare size={18} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[14px] font-bold text-gray-900">Support Chat AI</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Enhances replies + auto-replies to disputes</p>
                </div>
              </div>
              <div className="px-5 py-3 bg-violet-50/50 border-b border-violet-100/50">
                <div className="flex items-start gap-2">
                  <Sparkles size={13} className="text-violet-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-violet-700 leading-relaxed">
                    <strong>Enhance Button:</strong> click sparkle to polish your reply. <strong>Auto-Reply:</strong> AI responds if you don&apos;t reply in time.
                  </p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <SSelect label="AI Provider" value={cp} onChange={(v) => setChatProv(v as Provider)}
                  options={Object.entries(PROVIDER_MODELS).map(([k, v]) => ({ value: k, label: v.label }))}
                  help="Which AI enhances chat replies" />
                <SSelect label="Model" value={s.chatModel} onChange={(v) => up("chatModel", v)}
                  options={PROVIDER_MODELS[cp].models.map((m) => ({ value: m.id, label: m.name, desc: m.desc }))}
                  help="Groq is fastest for real-time enhancement" />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800 flex items-center gap-1.5">
                      <Zap size={13} className="text-amber-500" /> Auto-reply
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 ml-5">AI follows up if admin doesn&apos;t reply</p>
                  </div>
                  <button onClick={() => up("autoReplyEnabled", !s.autoReplyEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${s.autoReplyEnabled ? "bg-emerald-500" : "bg-gray-300"}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${s.autoReplyEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {s.autoReplyEnabled && (
                  <div className="ml-5 pl-3 border-l-2 border-amber-200">
                    <label className="block text-[13px] font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                      <Clock size={12} className="text-gray-400" /> Delay
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={5} max={1440} value={s.autoReplyMinutes}
                        onChange={(e) => up("autoReplyMinutes", Math.max(5, parseInt(e.target.value, 10) || 60))}
                        className="w-24 rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                      <span className="text-sm text-gray-500">minutes</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-400">Changes apply after saving.</p>
              <button onClick={save} disabled={saving}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all shadow-sm ${
                  saved ? "bg-emerald-500 text-white" : "bg-gray-900 text-white hover:bg-gray-800"
                } disabled:opacity-50`}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle size={15} /> : <Save size={15} />}
                {saved ? "Saved!" : saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>

          {/* ═══ RIGHT: Usage Dashboard ═══ */}
          <div className="xl:w-[420px] shrink-0 space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <BarChart3 size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-gray-900">AI Usage</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Token consumption &amp; costs</p>
                </div>
              </div>

              {!u ? (
                <div className="p-8 text-center text-gray-400 text-sm">No usage data yet</div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-px bg-gray-100">
                    {[
                      { icon: Hash, label: "Total Calls", value: String(u.totals.calls), color: "text-blue-600" },
                      { icon: Activity, label: "Total Tokens", value: fmtTokens(u.totals.totalTokens), color: "text-emerald-600" },
                      { icon: DollarSign, label: "Total Cost", value: fmtCost(u.totals.costUsd), color: "text-amber-600" },
                      { icon: AlertTriangle, label: "Failed", value: String(u.totals.failedCalls), color: u.totals.failedCalls > 0 ? "text-red-500" : "text-gray-400" },
                    ].map((card) => (
                      <div key={card.label} className="bg-white p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <card.icon size={12} className="text-gray-400" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{card.label}</span>
                        </div>
                        <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Token breakdown */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={13} className="text-gray-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Token Breakdown</span>
                    </div>
                    <div className="flex gap-3 text-center">
                      <div className="flex-1 bg-blue-50 rounded-lg p-2.5">
                        <p className="text-[10px] font-semibold text-blue-600 uppercase">Input</p>
                        <p className="text-[15px] font-bold text-blue-700 mt-0.5">{fmtTokens(u.totals.inputTokens)}</p>
                      </div>
                      <div className="flex-1 bg-emerald-50 rounded-lg p-2.5">
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase">Output</p>
                        <p className="text-[15px] font-bold text-emerald-700 mt-0.5">{fmtTokens(u.totals.outputTokens)}</p>
                      </div>
                    </div>
                  </div>

                  {/* By purpose */}
                  {u.byPurpose.length > 0 && (
                    <div className="p-4 border-t border-gray-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">By Purpose</span>
                      <div className="space-y-2">
                        {u.byPurpose.map((bp) => (
                          <div key={bp.purpose} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${purposeColor(bp.purpose)}`}>
                                {purposeLabel(bp.purpose)}
                              </span>
                              <span className="text-[11px] text-gray-400">{bp.calls} calls</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[12px] font-semibold text-gray-700">{fmtTokens(bp.tokens)}</span>
                              <span className="text-[10px] text-gray-400 ml-1.5">{fmtCost(bp.cost)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* By provider */}
                  {u.byProvider.length > 0 && (
                    <div className="p-4 border-t border-gray-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">By Provider</span>
                      <div className="space-y-2">
                        {u.byProvider.map((bp) => {
                          const maxTokens = Math.max(...u.byProvider.map((x) => x.tokens), 1);
                          const pct = Math.round((bp.tokens / maxTokens) * 100);
                          return (
                            <div key={bp.provider}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[12px] font-semibold text-gray-700 capitalize">{bp.provider}</span>
                                <span className="text-[11px] text-gray-500">{fmtTokens(bp.tokens)} &middot; {fmtCost(bp.cost)}</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent calls */}
                  {u.recentCalls.length > 0 && (
                    <div className="border-t border-gray-100">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Recent Calls</span>
                        <span className="text-[10px] text-gray-400">Last {u.recentCalls.length}</span>
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {u.recentCalls.map((call) => (
                          <div key={call.id} className="px-4 py-2.5 border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${call.success ? "bg-emerald-400" : "bg-red-400"}`} />
                                <span className="text-[12px] font-medium text-gray-800 truncate max-w-[140px]">{call.model}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${purposeColor(call.purpose)}`}>
                                  {purposeLabel(call.purpose)}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400">{timeAgo(call.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 ml-3.5">
                              <span className="text-[10px] text-gray-400">{fmtTokens(call.totalTokens)} tokens</span>
                              <span className="text-[10px] text-gray-400">{fmtCost(call.costUsd)}</span>
                              <span className="text-[10px] text-gray-400">{fmtDuration(call.durationMs)}</span>
                            </div>
                            {call.error && (
                              <p className="text-[10px] text-red-400 mt-1 ml-3.5 truncate">{call.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
