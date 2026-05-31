"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      onChange(data.url);
    } catch {
      setError("Upload failed — check Cloudinary config");
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  if (value) {
    return (
      <div className="relative group rounded-lg overflow-hidden">
        <img
          src={value}
          alt="Featured"
          className="w-full h-36 object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <button
            type="button"
            onClick={() => onChange("")}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-700 p-2 rounded-full hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="text-xs text-accent mb-2">{error}</p>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center justify-center h-28 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-navy/30 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        {uploading ? (
          <Loader2 size={22} className="text-navy animate-spin mb-1" />
        ) : (
          <Upload size={22} className="text-gray-300 mb-1" />
        )}
        <p className="text-xs text-gray-400">
          {uploading ? "Uploading..." : "Drop image or click to upload"}
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />

      <button
        type="button"
        onClick={() => setShowUrlInput(!showUrlInput)}
        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 mt-2 transition-colors"
      >
        <LinkIcon size={10} />
        {showUrlInput ? "Hide URL input" : "Or paste image URL"}
      </button>

      {showUrlInput && (
        <input
          type="url"
          placeholder="https://..."
          onBlur={(e) => {
            if (e.target.value.trim()) onChange(e.target.value.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) onChange(val);
            }
          }}
          className="w-full mt-2 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
        />
      )}
    </div>
  );
}
