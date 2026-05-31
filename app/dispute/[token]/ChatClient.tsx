"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Paperclip,
  ArrowLeft,
  AlertCircle,
  X,
  Loader2,
  Lock,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";

/* ─── Types ─── */

interface Message {
  id: string;
  chatId: string;
  sender: string;
  content: string;
  imageUrl: string;
  createdAt: string;
}

interface Chat {
  id: string;
  email: string;
  name: string;
  subject: string;
  description: string;
  secretToken: string;
  customPageSlug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

/* ─── Helpers ─── */

function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dateDivider(msgs: Message[], i: number): boolean {
  if (i === 0) return true;
  return new Date(msgs[i - 1].createdAt).toDateString() !== new Date(msgs[i].createdAt).toDateString();
}

function dateLabel(d: string): string {
  const dt = new Date(d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msg = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const diff = Math.floor((today.getTime() - msg.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return dt.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

const upload = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "ml_default");
  const r = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
  const d: { secure_url: string } = await r.json();
  return d.secure_url;
};

/* ─── Component ─── */

export default function ChatClient({ chat, token }: { chat: Chat; token: string }) {
  const [msgs, setMsgs] = useState<Message[]>(chat.messages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendImg, setPendImg] = useState<string | null>(null);
  const [lbox, setLbox] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [scrollBtn, setScrollBtn] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("chat-theme");
      if (s) return s === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isOpen = chat.status === "open";

  /* Keyboard-aware viewport for mobile (handles iOS Safari keyboard) */
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      if (rootRef.current) {
        rootRef.current.style.setProperty("--vh", `${vv.height}px`);
      }
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => { localStorage.setItem("chat-theme", dark ? "dark" : "light"); }, [dark]);

  const scrollEnd = useCallback((instant = false) => {
    endRef.current?.scrollIntoView({ behavior: instant ? "instant" : "smooth" });
  }, []);
  useEffect(() => { scrollEnd(); }, [msgs, scrollEnd]);
  useEffect(() => { scrollEnd(true); }, [scrollEnd]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) setScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  }, []);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/disputes/${token}`);
        if (r.ok) { const d: Chat = await r.json(); if (d.messages.length !== msgs.length) setMsgs(d.messages); }
      } catch { /* */ }
    }, 6000);
    return () => clearInterval(poll);
  }, [token, msgs.length]);

  const send = async () => {
    const c = input.trim();
    if (!c && !pendImg) return;
    if (sending) return;
    setErr(null); setSending(true);

    const opt: Message = { id: `t-${Date.now()}`, chatId: chat.id, sender: "user", content: c, imageUrl: pendImg || "", createdAt: new Date().toISOString() };
    setMsgs(p => [...p, opt]); setInput(""); setPendImg(null);
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const r = await fetch(`/api/disputes/${token}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: c, imageUrl: pendImg || "", sender: "user" }),
      });
      if (!r.ok) throw new Error();
      const saved: Message = await r.json();
      setMsgs(p => p.map(m => m.id === opt.id ? saved : m));
    } catch {
      setMsgs(p => p.filter(m => m.id !== opt.id));
      setErr("Failed to send.");
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; e.target.value = "";
    if (!f.type.startsWith("image/")) { setErr("Images only."); return; }
    if (f.size > 10485760) { setErr("Max 10MB."); return; }
    setUploading(true); setErr(null);
    try { setPendImg(await upload(f)); } catch { setErr("Upload failed."); } finally { setUploading(false); }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const d = dark; // shorthand

  return (
    <>
      <div ref={rootRef} className={`dc ${d ? "dk" : "lt"}`}>
        {/* Header */}
        <header className="dc-h">
          <button className="dc-bk" onClick={() => { if (chat.customPageSlug) window.location.href = `/p/${chat.customPageSlug}`; else window.history.back(); }}>
            <ArrowLeft size={20} />
          </button>
          <div className="dc-tw">
            <h1 className="dc-t">TruthStrike24 Support</h1>
            <p className="dc-st">
              <span className="dc-dot" />
              Online · Replies within 1 hour
            </p>
          </div>
          <div className="dc-sp" />
          <button className="dc-tm" onClick={() => setDark(!d)} title={d ? "Light mode" : "Dark mode"}>
            <div className="dc-track">
              <div className={`dc-thumb ${d ? "dc-tr" : "dc-tl"}`}>
                {d ? <Moon size={11} /> : <Sun size={11} />}
              </div>
            </div>
          </button>
        </header>

        {/* Messages */}
        <div ref={scrollRef} onScroll={onScroll} className="dc-m">
          {msgs.map((m, i) => {
            const isU = m.sender === "user";
            const isS = m.sender === "admin" || m.sender === "bot";
            const showD = dateDivider(msgs, i);

            return (
              <div key={m.id}>
                {showD && <div className="dc-dd"><span>{dateLabel(m.createdAt)}</span></div>}
                <div className={`dc-r ${isU ? "dc-ru" : "dc-rs"}`}>
                  {isS && (
                    <div className="dc-av-wrap">
                      <div className="dc-av">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
                          <path d="M5.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="dc-av-dot" />
                    </div>
                  )}
                  <div>
                    <div className={`dc-b ${isU ? "dc-bu" : "dc-bs"}`}>
                      {m.imageUrl && m.imageUrl.length > 0 && (
                        <div className="dc-iw" onClick={() => setLbox(m.imageUrl)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.imageUrl} alt="" className="dc-ig" loading="lazy" />
                        </div>
                      )}
                      {m.content && <p className="dc-tx">{m.content}</p>}
                    </div>
                    <span className={`dc-ti ${isU ? "dc-tir" : "dc-til"}`}>{formatTime(m.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} style={{ height: 1 }} />
        </div>

        {scrollBtn && <button className="dc-sb" onClick={() => scrollEnd()}><ChevronDown size={18} /></button>}

        {err && (
          <div className="dc-er">
            <AlertCircle size={14} /><span>{err}</span>
            <button onClick={() => setErr(null)}><X size={14} /></button>
          </div>
        )}

        {pendImg && (
          <div className="dc-pi">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendImg} alt="" className="dc-pii" />
            <span>Image ready</span>
            <button onClick={() => setPendImg(null)}><X size={14} /></button>
          </div>
        )}

        {/* Input */}
        <footer className="dc-f">
          {isOpen ? (
            <div className="dc-ir">
              <input ref={fileRef} type="file" accept="image/*" className="dc-hd" onChange={onFile} />
              <button className="dc-at" onClick={() => fileRef.current?.click()} disabled={uploading || sending}>
                {uploading ? <Loader2 size={20} className="dc-sp-anim" /> : <Paperclip size={20} />}
              </button>
              <div className="dc-iwr">
                <textarea ref={inputRef} value={input}
                  onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
                  onKeyDown={onKey} placeholder="Type something..." rows={1} disabled={sending} className="dc-in" />
              </div>
              <button className={`dc-sn ${input.trim() || pendImg ? "dc-sna" : ""}`}
                onClick={send} disabled={sending || (!input.trim() && !pendImg)}>
                {sending ? <Loader2 size={18} className="dc-sp-anim" /> : <Send size={18} />}
              </button>
            </div>
          ) : (
            <div className="dc-cl"><Lock size={14} /><span>This dispute has been closed.</span></div>
          )}
        </footer>

        {lbox && (
          <div className="dc-lb" onClick={() => setLbox(null)}>
            <button className="dc-lbc" onClick={() => setLbox(null)}><X size={22} /></button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lbox} alt="" className="dc-lbi" onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>

      <style>{`
        html,body{margin:0;padding:0;overflow:hidden;
          -webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
        /* Premium gradient background outside the chat card (desktop only) */
        @media(min-width:600px){
          html,body{background:radial-gradient(ellipse at top,#f0fdfa 0%,#f8fafc 40%,#eff6ff 100%)}
          html.dark body,body.dk-bg{background:radial-gradient(ellipse at top,#020617 0%,#0a0a0a 60%,#000 100%)}
        }
        *,*::before,*::after{box-sizing:border-box}
        /* Prevent iOS zoom on input focus */
        @supports (-webkit-touch-callout: none){
          input,textarea,select{font-size:16px !important}
        }

        /* Root — full-screen on mobile, centered card on desktop */
        .dc{position:fixed;inset:0;display:flex;flex-direction:column;
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
          width:100%;max-width:100%;
          /* Keyboard-aware height via JS-set --vh, falls back to 100% */
          height:var(--vh,100%);
          transition:background .3s,color .3s}
        .dc.lt{background:#fff;color:#1a1a1a}
        .dc.dk{background:#0f0f0f;color:#e5e5e5}
        /* Tablet+: centered card with rounded corners and elevation */
        @media(min-width:600px){
          .dc{position:fixed;top:20px;bottom:20px;left:50%;right:auto;
            transform:translateX(-50%);width:calc(100% - 40px);max-width:880px;inset:auto;
            border-radius:24px;overflow:hidden}
          .dc.lt{border:1px solid rgba(0,0,0,.04);box-shadow:0 20px 60px -10px rgba(15,42,90,.12),0 8px 24px -8px rgba(15,42,90,.08)}
          .dc.dk{border:1px solid rgba(255,255,255,.04);box-shadow:0 20px 60px -10px rgba(0,0,0,.6),0 8px 24px -8px rgba(0,0,0,.4)}
        }
        @media(min-width:600px) and (max-height:700px){
          .dc{top:10px;bottom:10px}
        }

        /* Header with safe area for notched phones */
        .dc-h{display:flex;align-items:center;gap:8px;padding:12px 14px;flex-shrink:0;z-index:10;
          transition:background .3s,border-color .3s;backdrop-filter:saturate(180%) blur(20px);
          -webkit-backdrop-filter:saturate(180%) blur(20px);
          padding-top:calc(12px + env(safe-area-inset-top));
          padding-left:calc(14px + env(safe-area-inset-left));
          padding-right:calc(14px + env(safe-area-inset-right))}
        .lt .dc-h{background:rgba(255,255,255,.85);border-bottom:1px solid rgba(0,0,0,.06)}
        .dk .dc-h{background:rgba(20,20,20,.85);border-bottom:1px solid rgba(255,255,255,.06)}

        /* Title wrapper with subtitle */
        .dc-tw{display:flex;flex-direction:column;min-width:0;gap:1px}
        .dc-st{margin:0;font-size:11px;display:flex;align-items:center;gap:5px;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
        .lt .dc-st{color:#94a3b8}
        .dk .dc-st{color:#64748b}
        .dc-dot{width:6px;height:6px;border-radius:50%;background:#10b981;
          box-shadow:0 0 0 2px rgba(16,185,129,.18);animation:pulse 2s ease-in-out infinite;flex-shrink:0}
        @keyframes pulse{
          0%,100%{box-shadow:0 0 0 2px rgba(16,185,129,.18)}
          50%{box-shadow:0 0 0 4px rgba(16,185,129,.08)}
        }
        .dc-bk{width:34px;height:34px;border-radius:50%;border:none;
          display:flex;align-items:center;justify-content:center;cursor:pointer;
          background:transparent;transition:all .2s cubic-bezier(.22,1,.36,1);flex-shrink:0;
          -webkit-tap-highlight-color:transparent}
        .lt .dc-bk{color:#333}.lt .dc-bk:hover{background:#f1f5f9;transform:scale(1.05)}
        .lt .dc-bk:active{transform:scale(.92)}
        .dk .dc-bk{color:#ccc}.dk .dc-bk:hover{background:#1f1f1f;transform:scale(1.05)}
        .dk .dc-bk:active{transform:scale(.92)}
        .dc-t{font-size:16px;font-weight:700;margin:0;letter-spacing:-.01em;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .lt .dc-t{color:#1a1a1a}.dk .dc-t{color:#f0f0f0}
        .dc-sp{flex:1;min-width:0}

        /* Theme toggle */
        .dc-tm{background:none;border:none;cursor:pointer;padding:0;display:flex;
          align-items:center;-webkit-tap-highlight-color:transparent;flex-shrink:0}
        .dc-track{width:42px;height:22px;border-radius:11px;position:relative;transition:background .3s}
        .lt .dc-track{background:#e8e8e8}
        .dk .dc-track{background:#2a2a2a}
        .dc-thumb{width:18px;height:18px;border-radius:50%;position:absolute;top:2px;
          display:flex;align-items:center;justify-content:center;
          transition:left .3s cubic-bezier(.34,1.56,.64,1),background .3s,color .3s;
          box-shadow:0 1px 3px rgba(0,0,0,.12)}
        .dc-tl{left:2px}.dc-tr{left:22px}
        .lt .dc-thumb{background:#fff;color:#f59e0b}
        .dk .dc-thumb{background:#333;color:#818cf8}

        /* Messages */
        .dc-m{flex:1;overflow-y:auto;padding:14px 10px 8px;
          -webkit-overflow-scrolling:touch;overscroll-behavior:contain;
          transition:background .3s}
        .lt .dc-m{background:linear-gradient(180deg,#fafafa 0%,#ffffff 100%)}
        .dk .dc-m{background:linear-gradient(180deg,#0a0a0a 0%,#0f0f0f 100%)}
        .dc-m::-webkit-scrollbar{width:3px}
        .dc-m::-webkit-scrollbar-track{background:transparent}
        .lt .dc-m::-webkit-scrollbar-thumb{background:#e0e0e0;border-radius:3px}
        .dk .dc-m::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px}

        /* Date */
        .dc-dd{text-align:center;margin:14px 0 10px}
        .dc-dd span{font-size:11px;font-weight:500;letter-spacing:.02em}
        .lt .dc-dd span{color:#aaa}.dk .dc-dd span{color:#555}

        /* Row */
        .dc-r{display:flex;margin-bottom:10px;align-items:flex-end;
          animation:ms .25s cubic-bezier(.22,1,.36,1)}
        .dc-ru{justify-content:flex-end}
        .dc-rs{justify-content:flex-start}

        /* Avatar with online dot */
        .dc-av-wrap{position:relative;margin-right:6px;flex-shrink:0;margin-bottom:18px}
        .dc-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;
          justify-content:center;transition:background .3s,border-color .3s,color .3s}
        .lt .dc-av{background:linear-gradient(135deg,#f0fdfa 0%,#ccfbf1 100%);border:1.5px solid #99f6e4;color:#0d9488;
          box-shadow:0 2px 6px -1px rgba(13,148,136,.18)}
        .dk .dc-av{background:linear-gradient(135deg,#042f2e 0%,#134e4a 100%);border:1.5px solid #134e4a;color:#5eead4;
          box-shadow:0 2px 6px -1px rgba(0,0,0,.5)}
        .dc-av-dot{position:absolute;bottom:0;right:0;width:9px;height:9px;border-radius:50%;
          background:#10b981;border:2px solid #fff}
        .dk .dc-av-dot{border-color:#0f0f0f}

        /* Bubble with shadow + smooth transitions */
        .dc-b{max-width:min(300px,78vw);padding:10px 14px;position:relative;
          transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .25s;
          will-change:transform}
        @media(hover:hover){
          .dc-b:hover{transform:translateY(-1px)}
          .lt .dc-bu:hover{box-shadow:0 8px 20px -4px rgba(45,212,191,.5)}
          .lt .dc-bs:hover{box-shadow:0 6px 14px -2px rgba(0,0,0,.06),0 2px 4px rgba(0,0,0,.04)}
          .dk .dc-bu:hover{box-shadow:0 8px 20px -4px rgba(13,148,136,.5)}
          .dk .dc-bs:hover{box-shadow:0 6px 14px -2px rgba(0,0,0,.5)}
        }
        .dc-bu{border-radius:18px 18px 4px 18px}
        .dc-bs{border-radius:18px 18px 18px 4px}
        .lt .dc-bu{background:linear-gradient(135deg,#5eead4,#2dd4bf);color:#fff;
          box-shadow:0 4px 14px -4px rgba(45,212,191,.4)}
        .dk .dc-bu{background:linear-gradient(135deg,#0d9488,#0f766e);color:#fff;
          box-shadow:0 4px 14px -4px rgba(13,148,136,.4)}
        .lt .dc-bs{background:#fff;color:#1f2937;border:1px solid #f1f5f9;
          box-shadow:0 2px 8px -2px rgba(0,0,0,.04),0 1px 2px rgba(0,0,0,.03)}
        .dk .dc-bs{background:#171717;color:#e5e5e5;border:1px solid #262626;
          box-shadow:0 2px 8px -2px rgba(0,0,0,.4)}

        /* Text */
        .dc-tx{margin:0;font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:break-word;
          overflow-wrap:break-word}

        /* Image in bubble */
        .dc-iw{margin:-6px -8px 8px;border-radius:12px;overflow:hidden;cursor:pointer}
        .dc-ig{display:block;width:100%;max-height:220px;object-fit:cover;transition:opacity .15s}
        .dc-iw:hover .dc-ig{opacity:.92}

        /* Time */
        .dc-ti{display:block;font-size:10px;margin-top:3px;font-weight:500;letter-spacing:.02em}
        .dc-tir{text-align:right}
        .dc-til{text-align:left;padding-left:4px}
        .lt .dc-ti{color:#bbb}.dk .dc-ti{color:#555}

        /* Scroll btn — floating with shadow */
        .dc-sb{position:absolute;bottom:76px;right:14px;z-index:20;width:36px;height:36px;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          cursor:pointer;border:none;animation:fu .25s cubic-bezier(.22,1,.36,1);
          transition:all .2s cubic-bezier(.22,1,.36,1);
          -webkit-tap-highlight-color:transparent;
          backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
        .lt .dc-sb{background:rgba(255,255,255,.95);border:1px solid #e5e7eb;
          box-shadow:0 8px 24px -6px rgba(15,42,90,.15),0 2px 6px rgba(15,42,90,.08);color:#475569}
        .lt .dc-sb:hover{transform:translateY(-2px);box-shadow:0 12px 28px -6px rgba(15,42,90,.2);color:#0d9488}
        .dk .dc-sb{background:rgba(26,26,26,.95);border:1px solid #2a2a2a;
          box-shadow:0 8px 24px -6px rgba(0,0,0,.5);color:#94a3b8}
        .dk .dc-sb:hover{transform:translateY(-2px);box-shadow:0 12px 28px -6px rgba(0,0,0,.6);color:#5eead4}

        /* Error */
        .dc-er{display:flex;align-items:center;gap:6px;margin:0 10px 6px;padding:8px 10px;
          background:#fef2f2;border:1px solid #fecaca;border-radius:10px;font-size:12px;color:#ef4444}
        .dc-er span{flex:1}
        .dc-er button{background:none;border:none;cursor:pointer;color:#ef4444;display:flex;padding:2px;
          -webkit-tap-highlight-color:transparent}

        /* Pending image */
        .dc-pi{display:flex;align-items:center;gap:8px;margin:0 10px 6px;padding:6px 10px;
          border-radius:10px;animation:fu .2s ease;transition:background .3s}
        .lt .dc-pi{background:#f9fafb;border:1px solid #e5e7eb}
        .dk .dc-pi{background:#151515;border:1px solid #252525}
        .dc-pii{width:40px;height:40px;border-radius:6px;object-fit:cover;border:1px solid #e5e7eb}
        .dc-pi span{flex:1;font-size:11px;font-weight:500}
        .lt .dc-pi span{color:#888}.dk .dc-pi span{color:#666}
        .dc-pi button{background:none;border:none;cursor:pointer;display:flex;padding:2px;
          -webkit-tap-highlight-color:transparent}
        .lt .dc-pi button{color:#aaa}.dk .dc-pi button{color:#555}

        /* Footer / Input bar with frosted glass + safe area */
        .dc-f{flex-shrink:0;padding:8px 10px;z-index:10;transition:background .3s,border-color .3s;
          backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px);
          padding-bottom:calc(8px + env(safe-area-inset-bottom));
          padding-left:calc(10px + env(safe-area-inset-left));
          padding-right:calc(10px + env(safe-area-inset-right))}
        .lt .dc-f{background:rgba(255,255,255,.92);border-top:1px solid rgba(0,0,0,.06)}
        .dk .dc-f{background:rgba(20,20,20,.92);border-top:1px solid rgba(255,255,255,.06)}

        .dc-ir{display:flex;align-items:flex-end;gap:6px}
        .dc-hd{display:none}

        .dc-at{width:36px;height:36px;border-radius:50%;border:none;display:flex;
          align-items:center;justify-content:center;cursor:pointer;background:transparent;
          flex-shrink:0;transition:all .2s cubic-bezier(.22,1,.36,1);-webkit-tap-highlight-color:transparent}
        .lt .dc-at{color:#94a3b8}.lt .dc-at:hover{color:#0d9488;transform:scale(1.1) rotate(-8deg);background:#f0fdfa}
        .lt .dc-at:active{transform:scale(.95) rotate(0)}
        .dk .dc-at{color:#525252}.dk .dc-at:hover{color:#5eead4;transform:scale(1.1) rotate(-8deg);background:#042f2e}
        .dk .dc-at:active{transform:scale(.95) rotate(0)}

        .dc-iwr{flex:1;min-width:0}
        .dc-in{width:100%;padding:9px 14px;border-radius:20px;font-size:16px;line-height:1.4;
          outline:none;resize:none;font-family:inherit;min-height:38px;max-height:120px;
          transition:all .25s cubic-bezier(.22,1,.36,1);
          -webkit-appearance:none;appearance:none;box-shadow:0 1px 0 rgba(0,0,0,.02) inset}
        .lt .dc-in{border:1.5px solid #e8e8e8;background:#fafafa;color:#1a1a1a}
        .lt .dc-in::placeholder{color:#c0c0c0}
        .lt .dc-in:focus{border-color:#5eead4;background:#fff;
          box-shadow:0 0 0 4px rgba(94,234,212,.15),0 1px 3px rgba(0,0,0,.04)}
        .dk .dc-in{border:1.5px solid #2a2a2a;background:#1a1a1a;color:#e5e5e5}
        .dk .dc-in::placeholder{color:#444}
        .dk .dc-in:focus{border-color:#0d9488;background:#151515;
          box-shadow:0 0 0 4px rgba(13,148,136,.18)}
        .dc-in::-webkit-scrollbar{width:0}

        .dc-sn{width:36px;height:36px;border-radius:50%;border:none;display:flex;
          align-items:center;justify-content:center;cursor:not-allowed;color:#fff;
          flex-shrink:0;background:#d4d4d4;position:relative;overflow:hidden;
          transition:all .3s cubic-bezier(.22,1,.36,1);
          -webkit-tap-highlight-color:transparent}
        .dk .dc-sn{background:#2a2a2a}
        .dc-sna{background:linear-gradient(135deg,#5eead4 0%,#2dd4bf 50%,#14b8a6 100%);
          background-size:200% 200%;cursor:pointer;
          box-shadow:0 4px 16px rgba(45,212,191,.45),0 2px 4px rgba(45,212,191,.2);
          animation:gShift 3s ease infinite}
        .dc-sna::before{content:"";position:absolute;inset:0;border-radius:50%;
          background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.5),transparent 60%);
          pointer-events:none;opacity:.7}
        .dc-sna:hover{transform:scale(1.08) rotate(-3deg);
          box-shadow:0 6px 22px rgba(45,212,191,.55),0 3px 8px rgba(45,212,191,.3)}
        .dc-sna:active{transform:scale(.92) rotate(0)}
        @keyframes gShift{
          0%,100%{background-position:0% 50%}
          50%{background-position:100% 50%}
        }

        .dc-cl{display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 0;font-size:13px}
        .lt .dc-cl{color:#aaa}.dk .dc-cl{color:#555}

        /* Lightbox */
        .dc-lb{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.95);
          display:flex;align-items:center;justify-content:center;cursor:pointer;
          animation:fi .2s ease}
        .dc-lbc{position:absolute;top:env(safe-area-inset-top,12px);right:12px;
          width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.1);
          border:none;display:flex;align-items:center;justify-content:center;
          cursor:pointer;color:#fff;transition:background .15s;
          -webkit-tap-highlight-color:transparent;margin-top:8px}
        .dc-lbc:hover{background:rgba(255,255,255,.2)}
        .dc-lbi{max-width:95vw;max-height:85vh;border-radius:6px;cursor:default;
          animation:ls .25s cubic-bezier(.22,1,.36,1);-webkit-user-select:none;user-select:none}

        /* ══ Mobile-first responsive ══ */

        /* Hide subtitle on very small screens */
        @media(max-width:374px){
          .dc-st{display:none}
        }

        /* Small phones (320-374px) */
        @media(max-width:374px){
          .dc-h{padding:8px 8px;gap:6px}
          .dc-bk{width:30px;height:30px}
          .dc-bk svg{width:18px;height:18px}
          .dc-t{font-size:14px}
          .dc-track{width:36px;height:20px;border-radius:10px}
          .dc-thumb{width:16px;height:16px}
          .dc-tr{left:18px}
          .dc-m{padding:10px 6px 6px}
          .dc-b{max-width:82vw;padding:8px 10px}
          .dc-tx{font-size:13px}
          .dc-av{width:24px;height:24px;margin-right:4px}
          .dc-av svg{width:12px;height:12px}
          .dc-f{padding:6px 6px}
          .dc-ir{gap:4px}
          .dc-at{width:32px;height:32px}
          .dc-at svg{width:18px;height:18px}
          .dc-sn{width:32px;height:32px}
          .dc-sn svg{width:16px;height:16px}
          .dc-in{padding:7px 10px;border-radius:16px;min-height:34px}
          .dc-er,.dc-pi{margin:0 6px 4px}
        }

        /* Standard phones (375-599px) */
        @media(min-width:375px) and (max-width:599px){
          .dc-h{padding:10px 12px}
          .dc-m{padding:12px 8px 8px}
          .dc-b{max-width:80vw;padding:9px 12px}
          .dc-f{padding:8px 10px}
        }

        /* Tablet/Desktop (600px+) */
        @media(min-width:600px){
          .dc-h{padding:16px 24px;gap:12px}
          .dc-bk{width:38px;height:38px}
          .dc-t{font-size:18px}
          .dc-m{padding:24px 28px 12px}
          .dc-b{max-width:480px;padding:11px 16px}
          .dc-tx{font-size:15px}
          .dc-f{padding:14px 24px}
          .dc-ir{gap:10px}
          .dc-at{width:40px;height:40px}
          .dc-sn{width:40px;height:40px}
          .dc-in{font-size:15px;padding:11px 18px;border-radius:22px;min-height:44px}
          .dc-av{width:34px;height:34px;margin-right:10px}
          .dc-av svg{width:18px;height:18px}
          .dc-r{margin-bottom:14px}
          .dc-dd{margin:24px 0 16px}
          .dc-dd span{font-size:12px}
        }

        /* Large desktop (1024px+) */
        @media(min-width:1024px){
          .dc-b{max-width:560px}
        }

        /* Animations */
        @keyframes ms{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fu{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fi{from{opacity:0}to{opacity:1}}
        @keyframes ls{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
        .dc-sp-anim{animation:sp .8s linear infinite}
        @keyframes sp{from{transform:rotate(0)}to{transform:rotate(360deg)}}

        /* Touch feedback for mobile */
        @media(hover:none){
          .dc-sna:hover{transform:none;box-shadow:0 4px 14px rgba(94,234,212,.3)}
          .dc-bk:hover,.dc-at:hover,.dc-sb:hover,.dc-lbc:hover{background:transparent}
        }
      `}</style>
    </>
  );
}
