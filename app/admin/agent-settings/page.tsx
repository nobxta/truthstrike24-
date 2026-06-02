"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Bot,
  MessageSquare,
  Image as ImageIcon,
  Loader2,
  Power,
  PowerOff,
  Clock,
  Sparkles,
  CheckCircle,
  Zap,
  DollarSign,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Play,
  ExternalLink,
  XCircle,
  Newspaper,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import TopBar from "@/components/admin/TopBar";
import { PROVIDER_MODELS } from "@/lib/ai-providers";

type Provider = "anthropic" | "openai" | "groq";
type TabKey = "news" | "chat" | "image";

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
  imageGenEnabled: boolean;
}

interface AgentStatus {
  enabled: boolean;
  intervalMinutes: number;
  lastPost: {
    id: string;
    title: string;
    slug: string;
    url: string;
    featuredImage: string;
    publishedAt: string;
    category: string;
    categoryColor: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      costUsd: number;
      durationMs: number;
      model: string;
      provider: string;
    } | null;
  } | null;
  nextPostAt: string | null;
  secondsUntilNextPost: number | null;
  stats: { postsToday: number; postsTotal: number };
  recentPosts: {
    id: string;
    title: string;
    slug: string;
    url: string;
    featuredImage: string;
    publishedAt: string;
    category: string;
  }[];
}

interface DashboardStats {
  postsToday: number;
  postsYesterday: number;
  postsThisWeek: number;
  spendThisWeek: number;
  errorsLast24h: number;
  recentErrors: {
    id: string;
    timestamp: string;
    title: string | null;
    error: string | null;
    model: string;
  }[];
}

interface UsageCall {
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
}

interface UsageData {
  recentCalls: UsageCall[];
}

interface RunResult {
  success?: boolean;
  status?: string;
  post?: { id: string; title: string; slug: string; url: string };
  topic?: string;
  provider?: string;
  model?: string;
  error?: string;
  raw?: string;
  enhanced?: string;
  featuredImage?: string;
  url?: string;
  title?: string;
  message?: string;
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
  writingStyle:
    "Professional journalism with specific names, dates, statistics, and quotes from real people. No filler.",
  postIntervalMinutes: 60,
  autoReplyEnabled: true,
  autoReplyMinutes: 60,
  imageGenEnabled: true,
};

const MODEL_SPEED_GUIDE = [
  { id: "llama-3.3-70b-versatile", tps: 500, quality: 4, sec: 5, badge: "FAST + GOOD", color: "emerald" },
  { id: "llama-3.1-8b-instant", tps: 750, quality: 3, sec: 3, badge: "FASTEST", color: "cyan" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", tps: 600, quality: 4, sec: 4, badge: "FAST + NEW", color: "blue" },
  { id: "claude-sonnet-4-5-20250514", tps: 50, quality: 5, sec: 20, badge: "BEST QUALITY (slow)", color: "violet" },
  { id: "claude-sonnet-4-6", tps: 50, quality: 5, sec: 20, badge: "BEST QUALITY (slow)", color: "violet" },
  { id: "gpt-4o-mini", tps: 100, quality: 5, sec: 11, badge: "QUALITY + CHEAP", color: "amber" },
  { id: "gpt-4o", tps: 80, quality: 5, sec: 13, badge: "PREMIUM (slow)", color: "amber" },
];

const IMAGE_MODELS = [
  { value: "wavespeed-ai/flux-schnell", label: "FLUX schnell", desc: "Fastest (~4s)" },
  { value: "wavespeed-ai/flux-dev", label: "FLUX dev", desc: "Best balance (~20s)" },
  { value: "wavespeed-ai/flux-dev-ultra-fast", label: "FLUX dev ultra-fast", desc: "Optimized (~10s)" },
  { value: "wavespeed-ai/flux-kontext-pro", label: "FLUX Kontext Pro", desc: "Image editing + reference" },
  { value: "wavespeed-ai/flux-kontext-max", label: "FLUX Kontext Max", desc: "Highest quality + reference" },
  { value: "wavespeed-ai/hidream-i1-full", label: "HiDream-I1", desc: "Premium quality (slow)" },
  { value: "wavespeed-ai/sdxl-lightning", label: "SDXL Lightning", desc: "Stable Diffusion (fast)" },
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
function fmtCostBig(n: number): string {
  return `$${n.toFixed(2)}`;
}
function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
function fmtInterval(min: number): string {
  if (min < 60) return `${min}min`;
  if (min === 60) return "1hr";
  return `${(min / 60).toFixed(1)}hr`;
}
function fmtCountdown(sec: number | null): string {
  if (sec === null) return "—";
  if (sec <= 0) return "Posting now";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
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
function purposeLabel(p: string): string {
  switch (p) {
    case "post": return "Article Gen";
    case "chat_enhance": return "Chat Enhance";
    case "auto_reply": return "Auto Reply";
    case "image": return "Image Gen";
    default: return p;
  }
}
function purposeColor(p: string): string {
  switch (p) {
    case "post": return "bg-orange-100 text-orange-700";
    case "chat_enhance": return "bg-violet-100 text-violet-700";
    case "auto_reply": return "bg-amber-100 text-amber-700";
    case "image": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-600";
  }
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

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-gray-300"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

/* ── Page ── */

export default function AgentSettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULT);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [dash, setDash] = useState<DashboardStats | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedToast, setSavedToast] = useState(false);
  const [tab, setTab] = useState<TabKey>("news");
  const [running, setRunning] = useState<TabKey | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runStage, setRunStage] = useState<string>("");
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const [chatTestInput, setChatTestInput] = useState("we will review your case and get back to you");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatch = useRef<Partial<Settings>>({});

  /* ── Initial load ── */
  const load = useCallback(async () => {
    try {
      const [sRes, stRes, dRes, uRes] = await Promise.all([
        fetch("/api/agent/settings"),
        fetch("/api/agent/status"),
        fetch("/api/agent/dashboard"),
        fetch("/api/ai/usage"),
      ]);
      if (sRes.ok) {
        const settingsData: Partial<Settings> = await sRes.json();
        setS((prev) => ({ ...prev, ...settingsData }));
      }
      if (stRes.ok) {
        const st: AgentStatus = await stRes.json();
        setStatus(st);
        setCountdown(st.secondsUntilNextPost);
      }
      if (dRes.ok) setDash(await dRes.json());
      if (uRes.ok) setUsage(await uRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Poll status (10s) ── */
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/agent/status");
        if (r.ok) {
          const d: AgentStatus = await r.json();
          setStatus(d);
          setCountdown(d.secondsUntilNextPost);
        }
      } catch { /* ignore */ }
    }, 10_000);
    return () => clearInterval(t);
  }, []);

  /* ── Poll dashboard (30s) ── */
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const [dRes, uRes] = await Promise.all([
          fetch("/api/agent/dashboard"),
          fetch("/api/ai/usage"),
        ]);
        if (dRes.ok) setDash(await dRes.json());
        if (uRes.ok) setUsage(await uRes.json());
      } catch { /* ignore */ }
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  /* ── Tick countdown locally ── */
  useEffect(() => {
    if (countdown === null || !status?.enabled) return;
    const t = setInterval(() => {
      setCountdown((c) => (c === null ? null : Math.max(0, c - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [countdown, status?.enabled]);

  /* ── Auto-save (debounced 500ms) ── */
  const flushSave = useCallback(async () => {
    const patch = pendingPatch.current;
    if (Object.keys(patch).length === 0) return;
    pendingPatch.current = {};
    try {
      const r = await fetch("/api/agent/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (r.ok) {
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 1500);
      }
    } catch (e) {
      console.error("save failed", e);
    }
  }, []);

  const up = useCallback(
    <K extends keyof Settings>(k: K, v: Settings[K]) => {
      setS((prev) => ({ ...prev, [k]: v }));
      pendingPatch.current = { ...pendingPatch.current, [k]: v };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void flushSave();
      }, 500);
    },
    [flushSave]
  );

  const setPostProv = (p: Provider) => {
    const firstModel = PROVIDER_MODELS[p].models[0]?.id ?? "";
    setS((prev) => ({ ...prev, postProvider: p, model: firstModel }));
    pendingPatch.current = { ...pendingPatch.current, postProvider: p, model: firstModel };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSave(), 500);
  };
  const setChatProv = (p: Provider) => {
    const firstModel = PROVIDER_MODELS[p].models[0]?.id ?? "";
    setS((prev) => ({ ...prev, chatProvider: p, chatModel: firstModel }));
    pendingPatch.current = { ...pendingPatch.current, chatProvider: p, chatModel: firstModel };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSave(), 500);
  };

  /* ── Test runners ── */
  const runNews = async () => {
    setRunning("news");
    setRunResult(null);
    setRunStage("Generating article...");
    try {
      const r = await fetch("/api/agent/post", { method: "POST" });
      const data: RunResult = await r.json();
      setRunResult(data);
    } catch (e) {
      setRunResult({ error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setRunStage("");
      setRunning(null);
      // Refresh dashboard
      try {
        const [dRes, stRes] = await Promise.all([
          fetch("/api/agent/dashboard"),
          fetch("/api/agent/status"),
        ]);
        if (dRes.ok) setDash(await dRes.json());
        if (stRes.ok) {
          const st: AgentStatus = await stRes.json();
          setStatus(st);
          setCountdown(st.secondsUntilNextPost);
        }
      } catch { /* */ }
    }
  };

  const runChatTest = async () => {
    setRunning("chat");
    setRunResult(null);
    try {
      const r = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chatTestInput }),
      });
      const data: RunResult = await r.json();
      setRunResult(data);
    } catch (e) {
      setRunResult({ error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setRunning(null);
    }
  };

  const runImageTest = async () => {
    setRunning("image");
    setRunResult(null);
    try {
      const r = await fetch("/api/agent/image", { method: "POST" });
      const data: RunResult = await r.json();
      setRunResult(data);
    } catch (e) {
      setRunResult({ error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setRunning(null);
    }
  };

  const pp = s.postProvider as Provider;
  const cp = s.chatProvider as Provider;

  const speedInfo = useMemo(
    () => MODEL_SPEED_GUIDE.find((m) => m.id === s.model),
    [s.model]
  );
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    violet: "bg-violet-50 border-violet-200 text-violet-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };

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

  const postsDelta = dash ? dash.postsToday - dash.postsYesterday : 0;

  return (
    <>
      <TopBar title="AI Agent Settings" />

      {/* Saved toast */}
      <div
        className={`fixed top-20 right-6 z-50 transition-all duration-200 ${
          savedToast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-emerald-500 text-white text-[12px] font-semibold px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle size={14} /> Saved
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 1 — Dashboard Hero                 */}
        {/* ═══════════════════════════════════════════ */}

        {/* Row A: 4 stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText size={16} className="text-orange-500" />}
            label="Posts Today"
            value={dash?.postsToday ?? 0}
            comparison={
              dash ? (
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                    postsDelta > 0 ? "text-emerald-600" : postsDelta < 0 ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {postsDelta > 0 ? <TrendingUp size={11} /> : postsDelta < 0 ? <TrendingDown size={11} /> : null}
                  {postsDelta > 0 ? `+${postsDelta}` : postsDelta} vs yesterday
                </span>
              ) : null
            }
          />
          <StatCard
            icon={<Activity size={16} className="text-blue-500" />}
            label="Posts This Week"
            value={dash?.postsThisWeek ?? 0}
          />
          <StatCard
            icon={<DollarSign size={16} className="text-amber-500" />}
            label="AI Spend (week)"
            value={dash ? fmtCostBig(dash.spendThisWeek) : "$0.00"}
          />
          <StatCard
            icon={<AlertTriangle size={16} className={dash && dash.errorsLast24h > 0 ? "text-red-500" : "text-gray-400"} />}
            label="Errors (24h)"
            value={dash?.errorsLast24h ?? 0}
            danger={!!dash && dash.errorsLast24h > 0}
          />
        </div>

        {/* Row B: Last Post + Next Post In */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Last Post */}
          <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper size={14} className="text-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Last Post</span>
            </div>
            {status?.lastPost ? (
              <div className="flex gap-4">
                {status.lastPost.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={status.lastPost.featuredImage}
                    alt=""
                    className="w-24 h-24 rounded-lg object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                    <ImageIcon size={20} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <a
                    href={status.lastPost.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] font-bold text-gray-900 hover:text-blue-600 line-clamp-2 leading-snug"
                  >
                    {status.lastPost.title}
                  </a>
                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(status.lastPost.publishedAt)}</p>
                  {status.lastPost.usage && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-600">
                      <span>{status.lastPost.usage.provider}/{status.lastPost.usage.model.slice(0, 22)}</span>
                      <span>·</span>
                      <span>{fmtTokens(status.lastPost.usage.totalTokens)} tok</span>
                      <span>·</span>
                      <span className="text-amber-700 font-semibold">{fmtCost(status.lastPost.usage.costUsd)}</span>
                      <span>·</span>
                      <span>{fmtDuration(status.lastPost.usage.durationMs)}</span>
                    </div>
                  )}
                  <a
                    href={status.lastPost.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 mt-2"
                  >
                    View article <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Newspaper size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-[13px] text-gray-400">No posts yet</p>
              </div>
            )}
          </div>

          {/* Next Post In */}
          <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-emerald-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Next Post In</span>
              </div>
              {status?.enabled && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Active
                </span>
              )}
            </div>
            <div className="text-center py-4">
              <p
                className={`text-4xl sm:text-5xl font-bold tabular-nums tracking-tight ${
                  status?.enabled ? "text-gray-900" : "text-gray-300"
                }`}
              >
                {status?.enabled ? fmtCountdown(countdown) : "Paused"}
              </p>
              <p className="text-[11px] text-gray-400 mt-3">
                Interval: every {fmtInterval(status?.intervalMinutes ?? s.postIntervalMinutes)}
              </p>
            </div>
          </div>
        </div>

        {/* Row C: Errors banner */}
        {dash && dash.errorsLast24h > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setErrorsExpanded((v) => !v)}
              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-red-100/50 transition-colors"
            >
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="flex-1 text-left text-[13px] font-bold text-red-700">
                {dash.errorsLast24h} {dash.errorsLast24h === 1 ? "error" : "errors"} in last 24h
              </p>
              {errorsExpanded ? (
                <ChevronUp size={16} className="text-red-500" />
              ) : (
                <ChevronDown size={16} className="text-red-500" />
              )}
            </button>
            {errorsExpanded && (
              <div className="border-t border-red-200 max-h-[260px] overflow-y-auto">
                {dash.recentErrors.map((err) => (
                  <div key={err.id} className="px-5 py-3 border-b border-red-100 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">
                        {err.title || "(no title)"}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {timeAgo(err.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-red-600 leading-snug">{err.error}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Row D: Recent posts strip */}
        {status && status.recentPosts.length > 0 && (
          <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-gray-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Recent Posts ({status.recentPosts.length})
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {status.recentPosts.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 w-44 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden group"
                >
                  {p.featuredImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.featuredImage} alt="" className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                      <ImageIcon size={18} className="text-gray-300" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-blue-600">
                      {p.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(p.publishedAt)}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 2 — Agent Tabs                      */}
        {/* ═══════════════════════════════════════════ */}

        <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50/40">
            <TabButton
              active={tab === "news"}
              onClick={() => { setTab("news"); setRunResult(null); }}
              icon={<Bot size={15} />}
              label="News Agent"
              color="orange"
            />
            <TabButton
              active={tab === "chat"}
              onClick={() => { setTab("chat"); setRunResult(null); }}
              icon={<MessageSquare size={15} />}
              label="Chat Agent"
              color="violet"
            />
            <TabButton
              active={tab === "image"}
              onClick={() => { setTab("image"); setRunResult(null); }}
              icon={<ImageIcon size={15} />}
              label="Image Agent"
              color="blue"
            />
          </div>

          {/* Tab content */}
          <div className="p-5 sm:p-6">

            {/* Status bar: active toggle + test button */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              {tab === "news" && (
                <StatusBadge
                  enabled={s.enabled}
                  onToggle={() => up("enabled", !s.enabled)}
                  label="News Agent"
                />
              )}
              {tab === "chat" && (
                <StatusBadge
                  enabled={s.autoReplyEnabled}
                  onToggle={() => up("autoReplyEnabled", !s.autoReplyEnabled)}
                  label="Auto-Reply"
                />
              )}
              {tab === "image" && (
                <StatusBadge
                  enabled={s.imageGenEnabled}
                  onToggle={() => up("imageGenEnabled", !s.imageGenEnabled)}
                  label="Image Gen"
                />
              )}
              <button
                type="button"
                onClick={
                  tab === "news" ? runNews : tab === "chat" ? runChatTest : runImageTest
                }
                disabled={running !== null}
                className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {running === tab ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Play size={13} />
                )}
                {running === tab ? (runStage || "Running...") : "Test"}
              </button>
            </div>

            {/* News tab */}
            {tab === "news" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SSelect
                    label="AI Provider"
                    value={pp}
                    onChange={(v) => setPostProv(v as Provider)}
                    options={Object.entries(PROVIDER_MODELS).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                  <SSelect
                    label="Model"
                    value={s.model}
                    onChange={(v) => up("model", v)}
                    options={PROVIDER_MODELS[pp].models.map((m) => ({ value: m.id, label: m.name, desc: m.desc }))}
                  />
                </div>

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
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Topic Focus</label>
                  <textarea
                    value={s.topicFocus}
                    onChange={(e) => up("topicFocus", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none placeholder-gray-400"
                    placeholder="crypto scams 2026, staking fraud latest, exchange hacks this week, DeFi rug pulls, NFT phishing, AI investment scams, fake ICO alerts"
                  />
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Comma-separated topics. Each post AI picks ONE at random — more topics = more variety.
                    Add &ldquo;2026&rdquo; / &ldquo;latest&rdquo; / &ldquo;this week&rdquo; in topic names to push AI toward current news.
                    Last 20 published titles are auto-fed to AI so it won&rsquo;t repeat itself.
                    Turn ON <strong>Web Search</strong> below so AI researches real recent stories instead of inventing.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">
                      Word Limit
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={200}
                        max={1500}
                        step={50}
                        value={s.wordLimit}
                        onChange={(e) => up("wordLimit", parseInt(e.target.value, 10))}
                        className="flex-1 accent-blue-500"
                      />
                      <span className="w-16 text-center text-sm font-bold text-gray-900 bg-gray-100 rounded px-2 py-1">
                        {s.wordLimit}w
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">
                      Posting Interval
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={5}
                        max={360}
                        step={5}
                        value={s.postIntervalMinutes}
                        onChange={(e) => up("postIntervalMinutes", parseInt(e.target.value, 10))}
                        className="flex-1 accent-orange-500"
                      />
                      <span className="w-20 text-center text-sm font-bold text-gray-900 bg-gray-100 rounded px-2 py-1">
                        {fmtInterval(s.postIntervalMinutes)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Writing Style</label>
                  <textarea
                    value={s.writingStyle}
                    onChange={(e) => up("writingStyle", e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none placeholder-gray-400"
                    placeholder="Professional journalism with named sources..."
                  />
                </div>

                <div className="flex items-start justify-between gap-3 py-1">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-800">Web search (real news)</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ON: Claude searches the web. Adds 15-25s. Anthropic only.
                    </p>
                  </div>
                  <Toggle on={s.useWebSearch} onClick={() => up("useWebSearch", !s.useWebSearch)} />
                </div>
              </div>
            )}

            {/* Chat tab */}
            {tab === "chat" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SSelect
                    label="AI Provider"
                    value={cp}
                    onChange={(v) => setChatProv(v as Provider)}
                    options={Object.entries(PROVIDER_MODELS).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                  <SSelect
                    label="Model"
                    value={s.chatModel}
                    onChange={(v) => up("chatModel", v)}
                    options={PROVIDER_MODELS[cp].models.map((m) => ({ value: m.id, label: m.name, desc: m.desc }))}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                    <Zap size={13} className="text-amber-500" /> Auto-reply Delay
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={5}
                      max={1440}
                      step={5}
                      value={s.autoReplyMinutes}
                      onChange={(e) => up("autoReplyMinutes", parseInt(e.target.value, 10))}
                      className="flex-1 accent-violet-500"
                    />
                    <span className="w-24 text-center text-sm font-bold text-gray-900 bg-gray-100 rounded px-2 py-1">
                      {fmtInterval(s.autoReplyMinutes)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    How long to wait before AI auto-replies if admin is offline.
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">
                    Test Input
                  </label>
                  <textarea
                    value={chatTestInput}
                    onChange={(e) => setChatTestInput(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none placeholder-gray-400"
                    placeholder="Sample reply to enhance..."
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Click <strong>Test</strong> above to send this text to the enhance endpoint.
                  </p>
                </div>
              </div>
            )}

            {/* Image tab */}
            {tab === "image" && (
              <div className="space-y-5">
                <SSelect
                  label="Image Model (WaveSpeed.ai)"
                  value={s.imageModel}
                  onChange={(v) => up("imageModel", v)}
                  options={IMAGE_MODELS}
                  help="Schnell = fastest. Kontext models accept a reference image."
                />
                <div>
                  <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">
                    Brand Watermark URL
                  </label>
                  <input
                    type="url"
                    value={s.watermarkUrl}
                    onChange={(e) => up("watermarkUrl", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder-gray-400"
                    placeholder="https://res.cloudinary.com/.../logo.png"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Used as reference by Kontext models. Leave blank to skip.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-[11px] text-blue-700">
                    The <strong>Test</strong> button picks the oldest pending post and generates its image. If no pending posts exist, the worker returns idle.
                  </p>
                </div>
              </div>
            )}

            {/* Run result */}
            {runResult && (
              <div className="mt-5">
                <RunResultPanel result={runResult} tab={tab} />
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 3 — Live Activity Stream            */}
        {/* ═══════════════════════════════════════════ */}

        <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <Activity size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-[14px] font-bold text-gray-900">Live Activity</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Recent AI calls across all agents
              </p>
            </div>
            {usage && (
              <span className="text-[11px] text-gray-400">
                {usage.recentCalls.length} entries
              </span>
            )}
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {!usage || usage.recentCalls.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No activity yet</div>
            ) : (
              usage.recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="px-5 py-3 border-t border-gray-50 first:border-t-0 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        call.success ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    <span className="text-[11px] font-semibold text-gray-700 capitalize w-16 shrink-0">
                      {call.provider}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${purposeColor(call.purpose)} shrink-0`}
                    >
                      {purposeLabel(call.purpose)}
                    </span>
                    <span className="text-[12px] text-gray-600 truncate flex-1 min-w-0">
                      {call.model}
                    </span>
                    <span className="text-[11px] text-gray-500 tabular-nums shrink-0">
                      {fmtTokens(call.totalTokens)} tok
                    </span>
                    <span className="text-[11px] text-amber-700 font-semibold tabular-nums shrink-0 w-16 text-right">
                      {fmtCost(call.costUsd)}
                    </span>
                    <span className="text-[11px] text-gray-500 tabular-nums shrink-0 w-12 text-right">
                      {fmtDuration(call.durationMs)}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0 w-20 text-right">
                      {timeAgo(call.createdAt)}
                    </span>
                  </div>
                  {call.error && (
                    <p className="text-[11px] text-red-500 mt-1 ml-5 truncate">{call.error}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Subcomponents ── */

function StatCard({
  icon, label, value, comparison, danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  comparison?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border shadow-sm bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        danger ? "border-red-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>
      <p className={`text-3xl font-bold tabular-nums ${danger ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </p>
      {comparison && <div className="mt-1">{comparison}</div>}
    </div>
  );
}

function TabButton({
  active, onClick, icon, label, color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: "orange" | "violet" | "blue";
}) {
  const colorClass: Record<typeof color, string> = {
    orange: active ? "text-orange-600 border-orange-500" : "text-gray-500 border-transparent hover:text-gray-800",
    violet: active ? "text-violet-600 border-violet-500" : "text-gray-500 border-transparent hover:text-gray-800",
    blue: active ? "text-blue-600 border-blue-500" : "text-gray-500 border-transparent hover:text-gray-800",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-semibold border-b-2 transition-all ${colorClass[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusBadge({
  enabled, onToggle, label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full border transition-all ${
        enabled
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
      }`}
      title={`Click to toggle ${label}`}
    >
      {enabled ? <Power size={11} /> : <PowerOff size={11} />}
      {enabled ? "Active" : "Off"}
    </button>
  );
}

function RunResultPanel({ result, tab }: { result: RunResult; tab: TabKey }) {
  const isError =
    result.error !== undefined ||
    result.status === "failed" ||
    (result.success === false);

  if (isError) {
    return (
      <div className="rounded-lg p-3 text-[12px] border bg-red-50 border-red-200 text-red-700">
        <div className="flex items-center gap-2">
          <XCircle size={14} className="text-red-500 shrink-0" />
          <span className="font-bold">Failed: {result.error || "Unknown error"}</span>
        </div>
        {result.raw && (
          <pre className="ml-6 mt-1.5 text-[10px] bg-white/60 rounded p-2 overflow-x-auto">
            {result.raw}
          </pre>
        )}
      </div>
    );
  }

  // News success
  if (tab === "news" && result.success && result.post) {
    return (
      <div className="rounded-lg p-3 text-[12px] border bg-emerald-50 border-emerald-200 text-emerald-800">
        <div className="flex items-center gap-2 mb-1.5">
          <CheckCircle size={14} className="text-emerald-500 shrink-0" />
          <span className="font-bold">Article published</span>
        </div>
        <p className="ml-6"><strong>Title:</strong> {result.post.title}</p>
        {result.topic && <p className="ml-6"><strong>Topic:</strong> {result.topic}</p>}
        {result.provider && result.model && (
          <p className="ml-6"><strong>Model:</strong> {result.provider} / {result.model}</p>
        )}
        <a
          href={result.post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-6 inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline font-semibold mt-1"
        >
          View article <ExternalLink size={11} />
        </a>
      </div>
    );
  }

  // Chat enhance success
  if (tab === "chat" && result.enhanced) {
    return (
      <div className="rounded-lg p-3 text-[12px] border bg-violet-50 border-violet-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-violet-500 shrink-0" />
          <span className="font-bold text-violet-900">Enhanced output</span>
        </div>
        <p className="ml-6 text-gray-700 leading-relaxed bg-white/60 rounded p-2 border border-violet-100">
          {result.enhanced}
        </p>
      </div>
    );
  }

  // Image agent results
  if (tab === "image") {
    if (result.status === "idle") {
      return (
        <div className="rounded-lg p-3 text-[12px] border bg-gray-50 border-gray-200 text-gray-600">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-gray-400 shrink-0" />
            <span className="font-semibold">{result.message || "No pending posts"}</span>
          </div>
        </div>
      );
    }
    if (result.status === "done" && result.featuredImage) {
      return (
        <div className="rounded-lg p-3 text-[12px] border bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
            <span className="font-bold text-emerald-800">Image generated</span>
          </div>
          <div className="flex gap-3 ml-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.featuredImage}
              alt=""
              className="w-32 h-20 object-cover rounded border border-emerald-200"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{result.title}</p>
              {result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline mt-1"
                >
                  View post <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  // Generic success fallback
  return (
    <div className="rounded-lg p-3 text-[12px] border bg-emerald-50 border-emerald-200 text-emerald-800">
      <div className="flex items-center gap-2">
        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
        <span className="font-bold">Success</span>
      </div>
    </div>
  );
}
