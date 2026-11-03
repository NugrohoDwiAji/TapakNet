"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WifiOff, RotateCcw, LayoutDashboard, ShieldAlert } from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#072255] via-[#0B3B7B] to-[#072255] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#1E69DE]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#0B4EA2]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-center space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo and Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border border-slate-100 flex items-center justify-center p-1 bg-white">
            <Image
              src="/images/logo.png"
              alt="tapakNet Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <WifiOff className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            Mode Offline
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#072255]">
            Koneksi Terputus
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Perangkat Anda sedang tidak terhubung ke jaringan internet atau server lokal tapakNet.
          </p>
        </div>

        {/* Online detection helper */}
        {isOnline && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Koneksi terdeteksi kembali! Tekan muat ulang.
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full py-3 px-4 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Muat Ulang Halaman
          </button>

          <Link
            href="/dashboard"
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all block"
          >
            <LayoutDashboard className="w-4 h-4" />
            Coba Buka Cache Dashboard
          </Link>
        </div>

        {/* System Footer Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
          <span>tapakNet PWA Core Engine</span>
        </div>
      </div>
    </div>
  );
}
