"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Search,
  Loader2,
  Download,
  Trash2,
  Inbox,
  UserCheck,
  UserX,
  TrendingUp,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import TopBar from "@/components/admin/TopBar";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  status: string;
  createdAt: string;
  ipAddress: string | null;
}

interface Stats {
  active: number;
  unsubscribed: number;
  thisWeek: number;
  total: number;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/newsletter?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
        setStats(data.stats || null);
      }
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this subscriber?")) return;
    await fetch(`/api/newsletter?id=${id}`, { method: "DELETE" });
    load();
  };

  const exportCSV = () => {
    const rows = [
      ["Email", "Name", "Source", "Status", "Subscribed At"],
      ...subscribers.map((s) => [
        s.email,
        s.name || "",
        s.source,
        s.status,
        new Date(s.createdAt).toISOString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `truthstrike24-newsletter-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyEmails = () => {
    const emails = subscribers
      .filter((s) => s.status === "active")
      .map((s) => s.email)
      .join(", ");
    navigator.clipboard.writeText(emails);
    setCopiedId("all");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyOne = (id: string, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  function sourceBadge(source: string) {
    const colors: Record<string, string> = {
      footer: "bg-blue-50 text-blue-700",
      popup: "bg-violet-50 text-violet-700",
      sidebar: "bg-amber-50 text-amber-700",
      article: "bg-emerald-50 text-emerald-700",
    };
    return colors[source] || "bg-gray-100 text-gray-700";
  }

  return (
    <>
      <TopBar title="Newsletter" />
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Newsletter</h1>
              <p className="text-xs text-gray-500">
                {stats ? `${stats.active} active subscribers` : "Loading..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyEmails}
              disabled={!stats?.active}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {copiedId === "all" ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy emails
                </>
              )}
            </button>
            <button
              onClick={exportCSV}
              disabled={subscribers.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Coming Soon banner */}
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-amber-900">
              Sending tools coming soon
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              For now, the form just saves emails and confirms with a welcome message. The full
              newsletter sender (compose, schedule, segment) is planned but not yet built.
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: UserCheck, label: "Active", value: stats.active, color: "text-emerald-600" },
              { icon: TrendingUp, label: "This week", value: stats.thisWeek, color: "text-blue-600" },
              { icon: UserX, label: "Unsubscribed", value: stats.unsubscribed, color: "text-gray-400" },
              { icon: Inbox, label: "All-time", value: stats.total, color: "text-violet-600" },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white border border-gray-200 rounded-lg p-3.5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <card.icon size={12} className="text-gray-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {card.label}
                  </span>
                </div>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 size={20} className="animate-spin mx-auto text-gray-400" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="p-12 text-center">
              <Mail size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No subscribers yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Add the &lt;NewsletterSignup /&gt; widget to your site to start collecting emails.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Email</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Name</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Source</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Subscribed</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copyOne(s.id, s.email)}
                          className="flex items-center gap-1.5 text-[13px] text-gray-900 font-medium hover:text-blue-600"
                          title="Click to copy"
                        >
                          {s.email}
                          {copiedId === s.id ? (
                            <CheckCircle2 size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={11} className="text-gray-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-600">
                        {s.name || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sourceBadge(s.source)}`}>
                          {s.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold ${
                          s.status === "active" ? "text-emerald-600" : "text-gray-400"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">
                        {timeAgo(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-400 mt-3 text-center">
          Showing {subscribers.length} of {stats?.total || 0} subscribers
        </p>
      </div>
    </>
  );
}
