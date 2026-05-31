"use client";

import { useState, useRef, useEffect } from "react";
import { Languages, ChevronDown, Check, RotateCcw } from "lucide-react";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "zh-CN", name: "Chinese", nativeName: "中文" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
];

const STORAGE_KEY = "truthstrike-lang";

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("en");
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Create the hidden Google Translate widget container + init function on mount
  useEffect(() => {
    if (!document.getElementById("g-translate-widget")) {
      const div = document.createElement("div");
      div.id = "g-translate-widget";
      div.style.cssText = "position:absolute;opacity:0;height:0;width:0;overflow:hidden;pointer-events:none";
      document.body.appendChild(div);
    }

    const win = window as unknown as Record<string, unknown>;
    if (!win.googleTranslateElementInit) {
      win.googleTranslateElementInit = () => {
        const google = win.google as {
          translate?: {
            TranslateElement: new (
              opts: { pageLanguage: string; autoDisplay: boolean },
              id: string
            ) => void;
          };
        };
        if (google?.translate?.TranslateElement) {
          new google.translate.TranslateElement(
            { pageLanguage: "en", autoDisplay: false },
            "g-translate-widget"
          );
        }
      };
    }
  }, []);

  useEffect(() => {
    setActiveLang(localStorage.getItem(STORAGE_KEY) || "en");
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSelect = (code: string) => {
    if (code === activeLang) {
      setOpen(false);
      return;
    }

    localStorage.setItem(STORAGE_KEY, code);

    const cookieVal = code === "en" ? "" : `/en/${code}`;
    document.cookie = `googtrans=${cookieVal};path=/`;
    document.cookie = `googtrans=${cookieVal};path=/;domain=${window.location.hostname}`;

    window.location.reload();
  };

  const currentLang = LANGUAGES.find((l) => l.code === activeLang);
  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative notranslate" translate="no">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-gray-600 hover:text-[#111111] dark:text-gray-300 dark:hover:text-white transition-all duration-200 text-xs font-medium"
        aria-label="Translate page"
        type="button"
      >
        <Languages size={14} />
        <span className="hidden sm:inline">
          {currentLang?.code === "en"
            ? "EN"
            : currentLang?.code.replace("-CN", "").toUpperCase() || "EN"}
        </span>
        <ChevronDown
          size={10}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 top-full mt-2 w-[280px] bg-white dark:bg-[#161622] rounded-xl shadow-2xl shadow-black/12 dark:shadow-black/50 border border-gray-200/80 dark:border-white/[0.08] z-50 transition-all duration-200 ease-out origin-top-right overflow-hidden ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Languages size={14} className="text-accent" />
              <span className="text-[13px] font-semibold text-[#111111] dark:text-white">
                Translate
              </span>
            </div>
            {activeLang !== "en" && (
              <button
                onClick={() => handleSelect("en")}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-accent transition-colors duration-200"
              >
                <RotateCcw size={10} />
                Reset
              </button>
            )}
          </div>

          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-[13px] text-[#111111] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Language list */}
        <div className="max-h-[320px] overflow-y-auto py-1.5 scrollbar-hide">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-gray-400">
              No languages found
            </div>
          ) : (
            filtered.map((lang) => {
              const isActive = lang.code === activeLang;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 ${
                    isActive
                      ? "bg-accent/[0.06] dark:bg-accent/[0.08]"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                      {lang.code.slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[13px] font-medium ${
                          isActive ? "text-accent" : "text-[#111111] dark:text-white"
                        }`}
                      >
                        {lang.name}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {lang.nativeName}
                      </span>
                    </div>
                  </div>
                  {isActive && <Check size={14} className="text-accent shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
            Page reloads in selected language
          </p>
        </div>
      </div>
    </div>
  );
}
