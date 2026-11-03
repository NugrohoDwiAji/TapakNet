"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { PwaProvider } from "@/context/PwaContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // If on login or offline page, render clean standalone view without sidebar or header
  if (pathname === "/login" || pathname === "/offline") {
    return (
      <SessionProvider>
        <PwaProvider>{children}</PwaProvider>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <PwaProvider>
        <div className="min-h-screen bg-[#F8FAFC]">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="lg:pl-64 flex flex-col min-h-screen">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </PwaProvider>
    </SessionProvider>
  );
}
