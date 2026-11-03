"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wifi,
  Users,
  Network,
  Workflow,
  BookOpenCheck,
  Radio,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PwaInstallButton from "@/components/pwa/PwaInstallButton";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Voucher & Hotspot",
    href: "/hotspot",
    icon: Wifi,
  },
  {
    name: "Pelanggan Rumahan",
    href: "/customers",
    icon: Users,
  },
  {
    name: "FTTH & Inventaris",
    href: "/infrastructure",
    icon: Network,
  },
  {
    name: "Topologi Jaringan",
    href: "/topology",
    icon: Workflow,
  },
  {
    name: "Buku Kas & Keuangan",
    href: "/finance",
    icon: BookOpenCheck,
  },
  {
    name: "Manajemen User",
    href: "/users",
    icon: UserCog,
  },
  {
    name: "Hak Akses (RBAC)",
    href: "/rbac",
    icon: ShieldCheck,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-[#072255] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-blue-900/40 shadow-2xl lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-5 border-b border-blue-900/40 bg-[#072255]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="tapakNet Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white font-mono">
                  tapak<span className="text-[#1E69DE]">Net</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-600/30 text-blue-300 rounded border border-blue-500/20">
                  ERP
                </span>
              </div>
              <p className="text-[11px] text-blue-200/60 font-medium">
                RT/RW Net Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-blue-300/50">
            Menu Utama
          </div>

          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
              (item.href === "/dashboard" && pathname === "/");

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 whitespace-nowrap",
                  isActive
                    ? "bg-[#0B4EA2] text-white shadow-sm border border-blue-400/20"
                    : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive ? "text-white" : "text-blue-300"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* PWA Quick Install */}
        <div className="pb-3">
          <PwaInstallButton />
        </div>

        {/* Minimal Footer */}
        <div className="px-4 py-3.5 border-t border-blue-900/40 bg-[#041433]/40 flex items-center justify-between text-[11px] text-blue-200/60">
          <span>tapakNet Core</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Online</span>
          </span>
        </div>
      </aside>
    </>
  );
}