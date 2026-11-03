"use client";

import { usePwa } from "@/context/PwaContext";
import { Download, Smartphone } from "lucide-react";

export default function PwaHeaderButton() {
  const { isInstallable, openInstallModal } = usePwa();

  if (!isInstallable) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={openInstallModal}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-[#0B4EA2] text-xs font-bold border border-blue-200/60 shadow-2xs transition-all duration-150 group cursor-pointer"
      title="Pasang aplikasi tapakNet ke HP atau Desktop"
    >
      <Download className="w-3.5 h-3.5 text-[#1E69DE] group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline">Pasang PWA</span>
    </button>
  );
}
