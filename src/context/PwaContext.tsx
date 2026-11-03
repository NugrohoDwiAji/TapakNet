"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Image from "next/image";
import PwaFloatingBanner from "@/components/pwa/PwaFloatingBanner";
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  Zap,
  Wifi,
  MonitorSmartphone,
  Info,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  showFloatingCard: boolean;
  openInstallModal: () => void;
  closeInstallModal: () => void;
  dismissFloatingCard: () => void;
  confirmInstall: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [showFloatingCard, setShowFloatingCard] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed PWA)
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(standaloneMode);

    // 2. Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Listen to beforeinstallprompt event (Android & Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. Listen to appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
      setShowFloatingCard(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. Timer to show non-intrusive floating banner if not installed and not dismissed
    const isDismissed = sessionStorage.getItem("tapaknet_pwa_banner_dismissed");
    let timer: NodeJS.Timeout;
    if (!standaloneMode && !isDismissed) {
      timer = setTimeout(() => {
        setShowFloatingCard(true);
      }, 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const openInstallModal = () => {
    setIsModalOpen(true);
  };

  const closeInstallModal = () => {
    setIsModalOpen(false);
    setInstallSuccess(false);
  };

  const dismissFloatingCard = () => {
    setShowFloatingCard(false);
    sessionStorage.setItem("tapaknet_pwa_banner_dismissed", "true");
  };

  const confirmInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setInstallSuccess(true);
        setTimeout(() => {
          setIsInstalled(true);
          setIsModalOpen(false);
          setShowFloatingCard(false);
        }, 1800);
      }
      setDeferredPrompt(null);
    }
  };

  const isInstallable = !isStandalone && !isInstalled;

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isStandalone,
        isInstalled,
        isIOS,
        showFloatingCard,
        openInstallModal,
        closeInstallModal,
        dismissFloatingCard,
        confirmInstall,
      }}
    >
      {children}

      {/* Floating Bottom Card / Banner */}
      <PwaFloatingBanner />

      {/* Custom Confirmation Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#072255] via-[#0B4EA2] to-[#1E69DE]" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Image
                    src="/images/logo.png"
                    alt="tapakNet Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#072255] tracking-tight">
                    Pasang Aplikasi tapakNet
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                      <Sparkles className="w-3 h-3 text-[#0B4EA2]" />
                      PWA Standalone
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      RT/RW Net ERP
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeInstallModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success State */}
            {installSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-[#072255]">
                    Aplikasi Berhasil Dipasang!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    tapakNet kini tersedia di Layar Utama (Home Screen) perangkat Anda.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Apakah Anda ingin memasang <strong>tapakNet ERP</strong> di perangkat ini? Nikmati akses cepat dan pengelolaan jaringan tanpa batas langsung dari menu utama.
                </p>

                {/* Benefits List */}
                <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex items-start gap-2.5 text-xs text-slate-700">
                    <MonitorSmartphone className="w-4 h-4 text-[#0B4EA2] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Layar Penuh (Fullscreen):</strong> Buka aplikasi mandiri tanpa bilah URL browser.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-700">
                    <Zap className="w-4 h-4 text-[#0B4EA2] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Performa Lebih Cepat:</strong> Aset disimpan secara lokal untuk responsivitas maksimal.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-700">
                    <Wifi className="w-4 h-4 text-[#0B4EA2] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Dukungan Offline:</strong> Memuat otomatis halaman offline saat sinyal minim di lapangan.
                    </div>
                  </div>
                </div>

                {/* iOS Instructions Guide */}
                {isIOS ? (
                  <div className="space-y-2.5 bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 text-xs">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#0B4EA2]" />
                      Panduan Pasang di iPhone / iPad (Safari):
                    </div>
                    <div className="space-y-2 text-slate-700">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#0B4EA2] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          Ketuk tombol <strong>Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-[#0B4EA2]" /> di bilah navigasi Safari.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#0B4EA2] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          Pilih <strong>Tambah ke Layar Utama</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-[#0B4EA2]" /> (Add to Home Screen).
                        </span>
                      </div>
                    </div>
                  </div>
                ) : !deferredPrompt ? (
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p>
                      Untuk memasang di peramban ini, klik ikon <strong>Pasang (Install)</strong> pada bilah alamat URL atas atau buka menu browser (⋮) $\rightarrow$ <strong>Pasang Aplikasi</strong>.
                    </p>
                  </div>
                ) : null}

                {/* Modal Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeInstallModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Nanti Saja
                  </button>

                  {deferredPrompt ? (
                    <button
                      type="button"
                      onClick={confirmInstall}
                      className="px-5 py-2.5 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Pasang Sekarang</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={closeInstallModal}
                      className="px-5 py-2.5 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Saya Mengerti
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}

const defaultPwaContext: PwaContextType = {
  isInstallable: false,
  isStandalone: false,
  isInstalled: false,
  isIOS: false,
  showFloatingCard: false,
  openInstallModal: () => {},
  closeInstallModal: () => {},
  dismissFloatingCard: () => {},
  confirmInstall: async () => {},
};

export function usePwa() {
  const context = useContext(PwaContext);
  return context || defaultPwaContext;
}
