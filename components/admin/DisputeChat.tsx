"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ImagePlus, Loader2, Lock, Unlock, Copy, Check, Sparkles } from "lucide-react";
import Image from "next/image";

interface SerializedDispute {
  id: string;
  email: string;
  name: string;
  subject: string;
  description: string;
  secretToken: string;
  customPageId: string | null;
  customPageSlug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SerializedMessage {
  id: string;
  chatId: string;
  sender: string;
  content: string;
  imageUrl: string;
  createdAt: string;
}

interface AdminDisputeChatProps {
  dispute: SerializedDispute;
  initialMessages: SerializedMessage[];
}

const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dumhqc5k6/image/upload`,
    { method: "POST", body: formData }
  );
  const data: { secure_url: string } = await res.json();
  return data.secure_url;
};

export default function AdminDisputeChat({
  dispute,
  initialMessages,
}: AdminDisputeChatProps) {
  const [messages, setMessages] = useState<SerializedMessage[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState(dispute.status);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed && !imageUrl) return;

    setSending(true);
    try {
      const res = await fetch(
        `/api/disputes/${dispute.secretToken}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: trimmed || "(image)",
            imageUrl,
            sender: "admin",
          }),
        }
      );

      if (res.ok) {
        const newMsg: SerializedMessage = await res.json();
        setMessages((prev) => [
          ...prev,
          { ...newMsg, createdAt: new Date(newMsg.createdAt).toISOString() },
        ]);
        setContent("");
        setImageUrl("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const newStatus = status === "open" ? "closed" : "open";
      const res = await fetch(
        `/api/disputes/${dispute.secretToken}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        setStatus(newStatus);
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleCopyLink = async () => {
    const siteUrl = window.location.origin;
    const link = `${siteUrl}/dispute/${dispute.secretToken}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEnhance = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setEnhancing(true);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          chatToken: dispute.secretToken,
          chatId: dispute.id,
        }),
      });

      if (res.ok) {
        const data: { enhanced: string } = await res.json();
        setContent(data.enhanced);
      }
    } catch (err) {
      console.error("Enhancement failed:", err);
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      {/* Chat header */}
      <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Conversation
          </h3>
          <span className="text-xs text-gray-400">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy Link"}
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              status === "open"
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
            }`}
          >
            {togglingStatus ? (
              <Loader2 size={12} className="animate-spin" />
            ) : status === "open" ? (
              <Lock size={12} />
            ) : (
              <Unlock size={12} />
            )}
            {status === "open" ? "Close Dispute" : "Reopen Dispute"}
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => {
          const isAdmin = msg.sender === "admin";
          return (
            <div
              key={msg.id}
              className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] ${
                  isAdmin ? "order-1" : "order-1"
                }`}
              >
                <div className={`flex items-center gap-1.5 mb-1 ${isAdmin ? "justify-end" : ""}`}>
                  <span className={`text-[11px] font-semibold ${isAdmin ? "text-accent" : "text-gray-500"}`}>
                    {isAdmin ? "Admin" : dispute.name}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    isAdmin
                      ? "bg-accent text-white rounded-br-sm"
                      : "bg-gray-900 text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.imageUrl && (
                  <div className={`mt-2 ${isAdmin ? "flex justify-end" : ""}`}>
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={msg.imageUrl}
                        alt="Attached image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {imageUrl && (
        <div className="px-5 py-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={imageUrl}
                alt="Upload preview"
                fill
                className="object-cover"
              />
            </div>
            <button
              onClick={() => setImageUrl("")}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-5 py-3.5 border-t border-gray-200 shrink-0">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ImagePlus size={18} />
            )}
          </button>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
          {content.trim().length > 0 && (
            <button
              onClick={handleEnhance}
              disabled={enhancing}
              title="AI Enhance"
              className="p-2.5 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {enhancing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={sending || (!content.trim() && !imageUrl)}
            className="p-2.5 rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
