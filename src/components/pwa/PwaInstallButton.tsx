"use client";

import { usePwa } from "@/context/PwaContext";
import { Download, Smartphone } from "lucide-react";

export default function PwaInstallButton() {
  const { isInstallable, openInstallModal } = usePwa();

  if (!isInstallable) {
    return null;
  }

  return (
    <div className="px-3 pt-2">
      <button
        type="button"
        onClick={openInstallModal}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/40 hover:to-indigo-600/40 border border-blue-400/30 text-white text-xs font-semibold shadow-sm transition-all duration-150 group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/30 flex items-center justify-center text-blue-300 group-hover:text-white transition-colors">
            <Download className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-bold text-white leading-tight">
              Pasang Aplikasi (PWA)
            </div>
            <div className="text-[9px] text-blue-200/70">
              Install di HP / Desktop
            </div>
          </div>
        </div>
        <Smartphone className="w-3.5 h-3.5 text-blue-300 opacity-70 group-hover:opacity-100" />
      </button>
    </div>
  );
}
