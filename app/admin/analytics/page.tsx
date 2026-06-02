"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Users,
  Bell,
  Globe2,
  Loader2,
  TrendingUp,
  Activity,
  Link as LinkIcon,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import TopBar from "@/components/admin/TopBar";

type RangeKey = "24h" | "7d" | "30d" | "90d";

interface DayBucket {
  date: string;
  views: number;
  unique: number;
}
interface CountryRow {
  country: string;
  views: number;
  percent: number;
}
interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  featuredImage: string;
  views: number;
  avgPerDay: number;
  category: string;
}
interface ReferrerRow {
  domain: string;
  views: number;
  percent: number;
}
interface PushFunnel {
  visitors: number;
  consented: number;
  notificationsOptIn: number;
  active: number;
}
interface AnalyticsData {
  range: RangeKey;
  stats: {
    totalViews: number;
    uniqueVisitors: number;
    activeSubscribers: number;
    topCountry: { code: string; views: number } | null;
  };
  viewsOverTime: DayBucket[];
  topCountries: CountryRow[];
  topArticles: ArticleRow[];
  topReferrers: ReferrerRow[];
  pushFunnel: PushFunnel;
  hourlyDistribution: number[][];
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  IN: "India",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  JP: "Japan",
  CN: "China",
  BR: "Brazil",
  RU: "Russia",
  IT: "Italy",
  ES: "Spain",
  MX: "Mexico",
  NL: "Netherlands",
  SE: "Sweden",
  PL: "Poland",
  PK: "Pakistan",
  BD: "Bangladesh",
  ID: "Indonesia",
  PH: "Philippines",
  NG: "Nigeria",
  ZA: "South Africa",
  AE: "UAE",
  SG: "Singapore",
  TR: "Turkey",
  KR: "South Korea",
  VN: "Vietnam",
  TH: "Thailand",
  MY: "Malaysia",
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("7d");

  const load = useCallback(async (r: RangeKey) => {
    try {
      const res = await fetch(`/api/analytics?range=${r}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const d: AnalyticsData = await res.json();
        setData(d);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load(range);
  }, [range, load]);

  useEffect(() => {
    const t = setInterval(() => {
      void load(range);
    }, 30_000);
    return () => clearInterval(t);
  }, [range, load]);

  return (
    <>
      <TopBar title="Analytics" />
      <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Range selector */}
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-gray-500">
            Auto-refreshing every 30 seconds. Bots excluded from all counts.
          </p>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden text-[12px] font-semibold">
            {(["24h", "7d", "30d", "90d"] as RangeKey[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 transition-colors ${
                  range === r
                    ? "bg-navy text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : !data ? (
          <div className="p-16 text-center text-gray-400 text-sm">
            No data available.
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Eye size={16} className="text-blue-500" />}
                label="Total Views"
                value={fmtNum(data.stats.totalViews)}
                sub={`Last ${range}`}
              />
              <StatCard
                icon={<Users size={16} className="text-violet-500" />}
                label="Unique Visitors"
                value={fmtNum(data.stats.uniqueVisitors)}
                sub={`Last ${range}`}
              />
              <StatCard
                icon={<Bell size={16} className="text-amber-500" />}
                label="Push Subscribers"
                value={fmtNum(data.stats.activeSubscribers)}
                sub="Active subscriptions"
              />
              <StatCard
                icon={<Globe2 size={16} className="text-emerald-500" />}
                label="Top Country"
                value={data.stats.topCountry?.code ?? "—"}
                sub={
                  data.stats.topCountry
                    ? `${fmtNum(data.stats.topCountry.views)} views`
                    : "No data"
                }
              />
            </div>

            {/* Views over time */}
            <Card title="Views Over Time" icon={<TrendingUp size={14} />}>
              <ViewsLineChart data={data.viewsOverTime} />
            </Card>

            {/* Two-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="Top Countries" icon={<Globe2 size={14} />}>
                {data.topCountries.length === 0 ? (
                  <EmptyState label="No country data yet" />
                ) : (
                  <div className="space-y-2">
                    {data.topCountries.map((c) => (
                      <div key={c.country} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2 font-semibold text-gray-700">
                            <span className="inline-block w-7 text-center font-mono text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 rounded px-1 py-0.5">
                              {c.country}
                            </span>
                            <span className="text-gray-600">
                              {COUNTRY_NAMES[c.country] || c.country}
                            </span>
                          </span>
                          <span className="tabular-nums text-gray-500">
                            {fmtNum(c.views)} ·{" "}
                            <span className="text-gray-400">
                              {c.percent.toFixed(1)}%
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${Math.max(2, c.percent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Top Referrers" icon={<LinkIcon size={14} />}>
                {data.topReferrers.length === 0 ? (
                  <EmptyState label="No external referrers yet" />
                ) : (
                  <div className="space-y-2">
                    {data.topReferrers.map((r) => (
                      <div key={r.domain} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-semibold text-gray-700 truncate max-w-[60%]">
                            {r.domain}
                          </span>
                          <span className="tabular-nums text-gray-500">
                            {fmtNum(r.views)} ·{" "}
                            <span className="text-gray-400">
                              {r.percent.toFixed(1)}%
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.max(2, r.percent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Top articles */}
            <Card title="Top Articles" icon={<Activity size={14} />}>
              {data.topArticles.length === 0 ? (
                <EmptyState label="No article views yet" />
              ) : (
                <div className="space-y-2">
                  {data.topArticles.map((a, idx) => (
                    <a
                      key={a.id}
                      href={`/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <span className="w-6 text-center text-[12px] font-bold text-gray-300 tabular-nums shrink-0">
                        {idx + 1}
                      </span>
                      {a.featuredImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.featuredImage}
                          alt=""
                          className="w-14 h-10 rounded object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-10 rounded bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                          <ImageIcon size={14} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate group-hover:text-blue-600">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {a.category}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[14px] font-bold text-gray-900 tabular-nums">
                          {fmtNum(a.views)}
                        </p>
                        <p className="text-[10px] text-gray-400 tabular-nums">
                          {a.avgPerDay.toFixed(1)}/day
                        </p>
                      </div>
                      <ExternalLink
                        size={12}
                        className="text-gray-300 group-hover:text-blue-500 shrink-0"
                      />
                    </a>
                  ))}
                </div>
              )}
            </Card>

            {/* Push funnel */}
            <Card title="Push Notification Funnel" icon={<Bell size={14} />}>
              <PushFunnelChart data={data.pushFunnel} />
            </Card>

            {/* Hourly heatmap */}
            <Card
              title="Hourly Traffic Heatmap"
              icon={<Activity size={14} />}
              subtitle="Day of week × hour (all-time, bot-excluded)"
            >
              <HourlyHeatmap data={data.hourlyDistribution} />
            </Card>
          </>
        )}
      </div>
    </>
  );
}

/* ── Subcomponents ── */

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold tabular-nums text-gray-900">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Card({
  title,
  icon,
  subtitle,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 shadow-sm bg-white">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        <div className="flex-1">
          <h2 className="text-[13px] font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-8 text-[12px] text-gray-400">{label}</div>
  );
}

/* ── Views Line Chart (SVG) ── */
function ViewsLineChart({ data }: { data: DayBucket[] }) {
  const W = 800;
  const H = 240;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 28;

  const maxY = useMemo(
    () => Math.max(1, ...data.map((d) => Math.max(d.views, d.unique))),
    [data]
  );

  if (data.length === 0) return <EmptyState label="No views yet" />;

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const yScale = (v: number) => padT + innerH - (v / maxY) * innerH;

  const path = (key: "views" | "unique") =>
    data
      .map(
        (d, i) =>
          `${i === 0 ? "M" : "L"}${padL + i * stepX},${yScale(d[key])}`
      )
      .join(" ");

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + innerH - t * innerH,
    label: Math.round(maxY * t),
  }));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[600px] h-[240px]"
        preserveAspectRatio="none"
      >
        {/* Grid */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={padL}
            x2={W - padR}
            y1={t.y}
            y2={t.y}
            stroke="#f3f4f6"
            strokeWidth={1}
          />
        ))}
        {/* Y labels */}
        {ticks.map((t, i) => (
          <text
            key={i}
            x={padL - 6}
            y={t.y + 3}
            textAnchor="end"
            className="text-[9px] fill-gray-400"
          >
            {fmtNum(t.label)}
          </text>
        ))}
        {/* X labels (only some) */}
        {data.map((d, i) => {
          const step = Math.max(1, Math.ceil(data.length / 8));
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={d.date}
              x={padL + i * stepX}
              y={H - 10}
              textAnchor="middle"
              className="text-[9px] fill-gray-400"
            >
              {fmtDate(d.date)}
            </text>
          );
        })}
        {/* Views area */}
        <path
          d={`${path("views")} L${padL + (data.length - 1) * stepX},${padT + innerH} L${padL},${padT + innerH} Z`}
          fill="url(#viewsGradient)"
          opacity={0.3}
        />
        <defs>
          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Lines */}
        <path
          d={path("views")}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d={path("unique")}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth={2}
          strokeDasharray="4 3"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500 px-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-blue-500" /> Total views
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 border-t-2 border-dashed border-violet-500" />{" "}
          Unique visitors
        </span>
      </div>
    </div>
  );
}

/* ── Push Funnel ── */
function PushFunnelChart({ data }: { data: PushFunnel }) {
  const max = Math.max(1, data.visitors);
  const steps = [
    { label: "Total Visitors", value: data.visitors, color: "bg-blue-500" },
    { label: "Cookie Consented", value: data.consented, color: "bg-violet-500" },
    {
      label: "Opted into Notifications",
      value: data.notificationsOptIn,
      color: "bg-amber-500",
    },
    {
      label: "Active Subscribers",
      value: data.active,
      color: "bg-emerald-500",
    },
  ];
  return (
    <div className="space-y-3">
      {steps.map((s) => {
        const pct = (s.value / max) * 100;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between text-[12px] mb-1">
              <span className="font-semibold text-gray-700">{s.label}</span>
              <span className="tabular-nums text-gray-500">
                {fmtNum(s.value)}
              </span>
            </div>
            <div className="h-6 rounded-md bg-gray-100 overflow-hidden">
              <div
                className={`h-full ${s.color} transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${Math.max(2, pct)}%` }}
              >
                <span className="text-[10px] font-bold text-white tabular-nums">
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Hourly Heatmap ── */
function HourlyHeatmap({ data }: { data: number[][] }) {
  const max = useMemo(() => {
    let m = 1;
    for (const row of data) for (const v of row) if (v > m) m = v;
    return m;
  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex items-center gap-1 mb-1 ml-10">
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="text-[9px] text-gray-400 text-center tabular-nums"
              style={{ width: "calc((100% - 0px) / 24)", minWidth: 18 }}
            >
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {data.map((row, day) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="w-9 text-[10px] font-semibold text-gray-500 shrink-0">
              {DAY_LABELS[day]}
            </span>
            {row.map((v, h) => {
              const intensity = v / max;
              const bg =
                v === 0
                  ? "#f9fafb"
                  : intensity > 0.75
                    ? "#1e40af"
                    : intensity > 0.5
                      ? "#3b82f6"
                      : intensity > 0.25
                        ? "#93c5fd"
                        : "#dbeafe";
              return (
                <div
                  key={h}
                  className="rounded shrink-0"
                  style={{
                    width: 18,
                    height: 18,
                    backgroundColor: bg,
                  }}
                  title={`${DAY_LABELS[day]} ${h}:00 — ${v} views`}
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 ml-10 text-[10px] text-gray-400">
          <span>Less</span>
          <span className="inline-block rounded" style={{ width: 14, height: 14, backgroundColor: "#dbeafe" }} />
          <span className="inline-block rounded" style={{ width: 14, height: 14, backgroundColor: "#93c5fd" }} />
          <span className="inline-block rounded" style={{ width: 14, height: 14, backgroundColor: "#3b82f6" }} />
          <span className="inline-block rounded" style={{ width: 14, height: 14, backgroundColor: "#1e40af" }} />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
