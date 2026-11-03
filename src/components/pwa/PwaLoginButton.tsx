"use client";

import { usePwa } from "@/context/PwaContext";
import { Download, Smartphone } from "lucide-react";

export default function PwaLoginButton() {
  const { isInstallable, openInstallModal } = usePwa();

  if (!isInstallable) return null;

  return (
    <button
      type="button"
      onClick={openInstallModal}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-blue-100 text-[11px] sm:text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-xs"
    >
      <Smartphone className="w-3.5 h-3.5 text-blue-300" />
      <span>Pasang Aplikasi di Layar Utama HP / PC</span>
    </button>
  );
}
