"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertOctagon, X, Trash2, CheckCircle2, RefreshCw } from "lucide-react";

interface ErrorRow {
  id: string;
  source: string;
  route: string | null;
  message: string;
  severity: string;
  resolved: boolean;
  createdAt: string;
}

/**
 * Floating error monitor tab — bottom-right of every admin page.
 * Collapsed: small chip showing unresolved count (or hidden if 0).
 * Expanded: list of recent errors with source, route, time, message.
 * Click an error → expand to show full stack. Mark resolved or delete.
 * Polls every 30s for fresh errors.
 */
export default function ErrorMonitor() {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [unresolved, setUnresolved] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/errors${showAll ? "?status=all" : ""}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const d = await res.json();
        setErrors(d.errors || []);
        setUnresolved(d.unresolvedCount || 0);
      }
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const resolve = async (id: string) => {
    await fetch(`/api/admin/errors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: true }),
    });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/errors?id=${id}`, { method: "DELETE" });
    if (selectedId === id) setSelectedId(null);
    load();
  };

  // Don't render anything if there's nothing to show and the panel is closed
  if (!open && unresolved === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors"
      >
        <AlertOctagon size={14} className="animate-pulse" />
        {unresolved} {unresolved === 1 ? "error" : "errors"}
      </button>
    );
  }

  const selected = errors.find((e) => e.id === selectedId);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[92vw] sm:w-[420px] max-h-[70vh] flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon size={14} />
          <h3 className="text-sm font-bold">Error Monitor</h3>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
            {unresolved} unresolved
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="p-1 rounded hover:bg-white/15"
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-white/15"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          Show resolved too
        </label>
        <button
          type="button"
          onClick={async () => {
            if (!confirm("Delete ALL error logs?")) return;
            await fetch("/api/admin/errors?all=1", { method: "DELETE" });
            setSelectedId(null);
            load();
          }}
          className="ml-auto text-[10px] text-gray-400 hover:text-red-600"
        >
          Clear all
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {errors.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircle2 size={22} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No errors. All systems green.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {errors.map((e) => {
              const isSelected = selectedId === e.id;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : e.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                      e.resolved ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          e.severity === "fatal"
                            ? "bg-red-600"
                            : e.severity === "warn"
                            ? "bg-amber-500"
                            : "bg-red-400"
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {e.source}
                      </span>
                      {e.route && (
                        <span className="text-[10px] text-gray-400 truncate">
                          · {e.route}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-gray-400 shrink-0">
                        {new Date(e.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-800 line-clamp-2 leading-snug">
                      {e.message}
                    </p>
                  </button>
                  {isSelected && (
                    <ErrorDetail id={e.id} onResolve={() => resolve(e.id)} onDelete={() => remove(e.id)} resolved={e.resolved} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ErrorDetail({
  id,
  onResolve,
  onDelete,
  resolved,
}: {
  id: string;
  onResolve: () => void;
  onDelete: () => void;
  resolved: boolean;
}) {
  const [detail, setDetail] = useState<{ stack: string | null; metadata: string | null } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/errors/${id}`)
      .then((r) => r.json())
      .then((d) => setDetail({ stack: d.stack, metadata: d.metadata }))
      .catch(() => setDetail({ stack: null, metadata: null }));
  }, [id]);

  return (
    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 space-y-2">
      {detail?.stack && (
        <pre className="text-[10px] font-mono text-gray-700 bg-white border border-gray-200 rounded p-2 overflow-x-auto max-h-40 leading-tight">
          {detail.stack}
        </pre>
      )}
      {detail?.metadata && (
        <pre className="text-[10px] font-mono text-gray-600 bg-white border border-gray-200 rounded p-2 overflow-x-auto max-h-32 leading-tight">
          {detail.metadata}
        </pre>
      )}
      <div className="flex items-center gap-2">
        {!resolved && (
          <button
            type="button"
            onClick={onResolve}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          >
            <CheckCircle2 size={11} /> Mark resolved
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
        >
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  );
}
