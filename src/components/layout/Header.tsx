"use client";

import { Menu, Calendar, Server, LogOut, User as UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PwaHeaderButton from "@/components/pwa/PwaHeaderButton";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getPageInfo = () => {
    if (pathname === "/" || pathname === "/dashboard") {
      return {
        title: "Executive Dashboard",
        subtitle: "Ringkasan Finansial, Performa Mitra & Kapasitas Jaringan",
      };
    }
    if (pathname.startsWith("/hotspot")) {
      return {
        title: "Manajemen Voucher & Mitra Hotspot",
        subtitle: "Sistem Konsinyasi Fleksibel, Drop Stok & Penarikan Setoran Berbasis Event",
      };
    }
    if (pathname.startsWith("/customers")) {
      return {
        title: "Pelanggan Bulanan / Rumahan",
        subtitle: "Manajemen Pelanggan PPPoE, Kartu Tagihan 12-Bulan & Integrasi WhatsApp",
      };
    }
    if (pathname.startsWith("/infrastructure")) {
      return {
        title: "Infrastruktur FTTH & Inventaris Gudang",
        subtitle: "Dokumentasi Master OLT, Visualisasi Port ODP & Serial Number Perangkat",
      };
    }
    if (pathname.startsWith("/topology")) {
      return {
        title: "Topologi Jaringan FTTH & Hotspot",
        subtitle: "Visualisasi Alur Distribusi Sinyal: Core NOC → OLT → PON Port → ODP → Klien & Mitra",
      };
    }
    if (pathname.startsWith("/finance")) {
      return {
        title: "Buku Kas & Manajemen Keuangan Induk",
        subtitle: "General Ledger Pemasukan & Pengeluaran, OpEx, CapEx & Laba Rugi",
      };
    }
    if (pathname.startsWith("/users")) {
      return {
        title: "Manajemen Pengguna",
        subtitle: "Kelola Akun Administrator, Teknisi Lapangan, dan Staf Keuangan",
      };
    }
    if (pathname.startsWith("/rbac")) {
      return {
        title: "Hak Akses & Wewenang (RBAC)",
        subtitle: "Konfigurasi Matriks Izin Modul (Role-Based Access Control) tapakNet",
      };
    }
    return {
      title: "tapakNet Management System",
      subtitle: "Standalone ERP RT/RW Net",
    };
  };

  const pageInfo = getPageInfo();
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const userRole = (session?.user as any)?.role || "ADMIN";

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Titles */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#072255]">
            {pageInfo.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 font-medium mt-0.5">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Header Controls & User Session */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date Badge */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-medium border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-[#0B4EA2]" />
          <span>{today}</span>
        </div>

        {/* System Mode Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-[#0B4EA2] text-xs font-semibold border border-blue-200/60 shadow-xs">
          <Server className="w-3.5 h-3.5 text-[#1E69DE]" />
          <span className="hidden lg:inline">ERP Core:</span>
          <span>Online</span>
        </div>

        {/* PWA Install Quick Button */}
        <PwaHeaderButton />

        {/* User Profile Pill */}
        {session?.user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#0B4EA2] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                {session.user.name?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-[#072255] leading-tight truncate max-w-[120px]">
                  {session.user.name}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {userRole}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
              title="Keluar dari akun (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Konfirmasi Logout"
        description="Apakah Anda yakin ingin keluar dari sesi tapakNet ERP? Anda harus masuk kembali dengan username & password untuk mengakses sistem."
        confirmText="Keluar Akun"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
}
