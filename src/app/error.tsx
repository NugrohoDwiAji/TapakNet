"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // If it's a ChunkLoadError, try reloading automatically once
    if (
      error?.message &&
      (error.message.includes("Loading chunk") ||
        error.message.includes("ChunkLoadError"))
    ) {
      const reloadKey = "chunk_error_reload_" + window.location.pathname;
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-slate-200 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#072255]">
          Terjadi Kendala Memuat Halaman
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error.message?.includes("Loading chunk")
            ? "Terdapat pembaruan bundle skrip atau koneksi terputus saat memuat halaman. Silakan muat ulang halaman."
            : error.message || "Terjadi kesalahan tidak terduga pada aplikasi."}
        </p>
        <button
          onClick={() => {
            sessionStorage.clear();
            window.location.reload();
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-md shadow-blue-900/20"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Muat Ulang Halaman</span>
        </button>
      </div>
    </div>
  );
}
