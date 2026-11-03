"use client";

import Image from "next/image";
import { X, Sparkles } from "lucide-react";
import { usePwa } from "@/context/PwaContext";

export default function PwaFloatingBanner() {
  const {
    isInstallable,
    showFloatingCard,
    dismissFloatingCard,
    openInstallModal,
  } = usePwa();

  if (!isInstallable || !showFloatingCard) {
    return null;
  }

  return (
    <aside
      aria-label="Rekomendasi Pasang Aplikasi tapakNet"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] max-w-sm w-[calc(100%-2rem)] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
      style={{
        position: "fixed",
        right: "1.25rem",
        bottom: "1.25rem",
        zIndex: 60,
      }}
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-blue-200/80 shadow-blue-950/15 flex items-center justify-between gap-3 text-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Image
              src="/images/logo.png"
              alt="tapakNet Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-[#072255] truncate leading-tight">
                Pasang tapakNet PWA
              </h4>
              <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-[#0B4EA2]">
                <Sparkles className="w-2.5 h-2.5" />
                Cepat
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              Akses instan dari Layar Utama HP / Desktop
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={openInstallModal}
            className="px-3.5 py-1.5 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-bold shadow-xs hover:shadow-blue-900/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Pasang
          </button>
          <button
            type="button"
            onClick={dismissFloatingCard}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup rekomendasi"
            aria-label="Tutup rekomendasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
