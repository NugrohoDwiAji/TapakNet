"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="antialiased font-sans bg-[#F8FAFC]">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#072255]">
              Terjadi Kesalahan Sistem
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {error.message || "Terjadi kesalahan tidak terduga pada aplikasi tapakNet."}
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-md shadow-blue-900/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
