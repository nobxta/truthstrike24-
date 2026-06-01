"use client";

import { useState } from "react";
import { Mail, CheckCircle2, X, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  token: string;
  email: string;
  alreadyUnsubscribed: boolean;
}

export default function UnsubscribeClient({
  token,
  email,
  alreadyUnsubscribed,
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    alreadyUnsubscribed ? "done" : "idle"
  );
  const [error, setError] = useState("");

  const handleUnsubscribe = async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/newsletter/unsubscribe?token=${token}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(180deg, #fafafa 0%, #f3f4f6 100%)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "white",
          borderRadius: 20,
          padding: 36,
          boxShadow: "0 4px 24px -8px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#dc2626",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            marginBottom: 24,
          }}
        >
          <span style={{ color: "#111" }}>TRUTH</span>
          <span>STRIKE</span>
          <span style={{ color: "#9ca3af", fontWeight: 400 }}>24</span>
        </Link>

        {status === "idle" && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Mail size={24} color="#dc2626" />
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#111",
                margin: "0 0 8px",
                letterSpacing: "-0.5px",
              }}
            >
              Unsubscribe from TruthStrike24
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                lineHeight: 1.6,
                margin: "0 0 8px",
              }}
            >
              You&apos;re about to remove this email from our newsletter:
            </p>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#111",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "10px 14px",
                margin: "0 0 24px",
              }}
            >
              {email}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                lineHeight: 1.5,
                margin: "0 0 24px",
              }}
            >
              You&apos;ll stop receiving all newsletter emails from us. You can
              re-subscribe anytime at truthstrike24.com.
            </p>
            <button
              onClick={handleUnsubscribe}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 12,
                background: "#dc2626",
                color: "white",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
            >
              <X size={16} /> Yes, unsubscribe me
            </button>
            <Link
              href="/"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 12,
                fontSize: 13,
                color: "#6b7280",
                textDecoration: "none",
                padding: "10px",
              }}
            >
              Cancel — keep me subscribed
            </Link>
          </>
        )}

        {status === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Loader2
              size={32}
              color="#dc2626"
              style={{ animation: "spin 1s linear infinite", margin: "0 auto" }}
            />
            <p style={{ marginTop: 16, color: "#6b7280", fontSize: 14 }}>
              Removing your email...
            </p>
          </div>
        )}

        {status === "done" && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <CheckCircle2 size={26} color="#10b981" />
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#111",
                margin: "0 0 8px",
                letterSpacing: "-0.5px",
              }}
            >
              You&apos;re unsubscribed
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                lineHeight: 1.6,
                margin: "0 0 8px",
              }}
            >
              <strong style={{ color: "#111" }}>{email}</strong> has been removed
              from our newsletter list.
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              We&apos;re sorry to see you go. If you change your mind, you can
              always re-subscribe at truthstrike24.com.
            </p>
            <Link
              href="/"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px 20px",
                borderRadius: 12,
                background: "#111",
                color: "white",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Back to TruthStrike24
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <AlertCircle size={26} color="#dc2626" />
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#111",
                margin: "0 0 8px",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                lineHeight: 1.6,
                margin: "0 0 20px",
              }}
            >
              {error}
            </p>
            <button
              onClick={() => setStatus("idle")}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 12,
                background: "#111",
                color: "white",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
