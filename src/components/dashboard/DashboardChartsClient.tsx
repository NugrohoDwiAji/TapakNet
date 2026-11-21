"use client";

import dynamic from "next/dynamic";

const DashboardCharts = dynamic(
  () => import("./DashboardCharts"),
  {
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 h-80 border border-slate-100 flex items-center justify-center text-slate-300 text-xs font-semibold">
          Memuat Grafik Tren Arus Kas...
        </div>
        <div className="bg-white rounded-3xl p-6 h-80 border border-slate-100 flex items-center justify-center text-slate-300 text-xs font-semibold">
          Memuat Komposisi Pendapatan...
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default DashboardCharts;
