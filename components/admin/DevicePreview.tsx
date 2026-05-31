"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone, Clock, BookOpen, User } from "lucide-react";

interface DevicePreviewProps {
  title: string;
  content: string;
  featuredImage: string;
  category: string;
  categoryColor: string;
  author: string;
  date: string;
  keyPoints: string[];
}

const devices = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "375px" },
] as const;

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
}

export default function DevicePreview({
  title,
  content,
  featuredImage,
  category,
  categoryColor,
  author,
  date,
  keyPoints,
}: DevicePreviewProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const selectedDevice = devices.find((d) => d.id === device)!;
  const readTime = estimateReadTime(content);
  const isMobile = device === "mobile";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-navy">Live Preview</h3>
        <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-gray-200">
          {devices.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  device === d.id
                    ? "bg-navy text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={14} />
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-gray-100 flex justify-center overflow-auto">
        <div
          className="bg-gray-50 shadow-2xl rounded-xl overflow-hidden transition-all duration-500"
          style={{
            width: selectedDevice.width,
            maxWidth: "100%",
            minHeight: "600px",
          }}
        >
          {/* Simulated header */}
          <div className="bg-navy/95 backdrop-blur-xl text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
            <span className="text-sm font-bold">
              Truth<span className="text-accent">Strike</span>
              <span className="text-white/50">24</span>
            </span>
            <div className="flex gap-2 text-[10px] text-gray-400">
              <span>Home</span>
              <span className="text-accent">{category || "News"}</span>
            </div>
          </div>

          {/* Hero image */}
          {featuredImage && (
            <div className="relative overflow-hidden">
              <img
                src={featuredImage}
                alt={title}
                className="w-full object-cover"
                style={{ maxHeight: isMobile ? "200px" : "350px" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent" />
            </div>
          )}

          {/* Article header card */}
          <div className={`${featuredImage ? "-mt-12 relative z-10 mx-3" : "mt-4 mx-3"}`}>
            <div className={`${featuredImage ? "bg-white rounded-xl shadow-lg p-5 border border-gray-100" : "p-4"}`}>
              {category && (
                <span
                  className="inline-block text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 uppercase tracking-wide"
                  style={{ backgroundColor: categoryColor || "#64748b" }}
                >
                  {category}
                </span>
              )}

              <h1
                className={`font-serif font-bold text-navy leading-tight ${
                  isMobile ? "text-xl" : "text-3xl"
                }`}
              >
                {title || "Your Article Title"}
              </h1>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-white font-bold text-[10px]">
                    {(author || "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{author || "Admin"}</p>
                    <p className="text-[10px] text-gray-400">{date || "Just now"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 ml-auto">
                  <BookOpen size={10} />
                  <span>{readTime} min read</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key points */}
          {keyPoints.length > 0 && (
            <div className="mx-3 mt-5">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
                  Key Takeaways
                </p>
                <ul className="space-y-1.5">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="text-xs text-blue-900 flex gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Article content */}
          <div className="mx-3 mt-5 pb-8">
            {content ? (
              <div
                className="article-content"
                style={{ fontSize: isMobile ? "14px" : "17px" }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-300 italic text-sm">
                  Start writing to see the preview...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
