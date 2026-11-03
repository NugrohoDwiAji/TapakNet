"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { formatRupiah } from "@/lib/utils";

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardChartsProps {
  cashflowTrend: Array<{
    label: string;
    income: number;
    expense: number;
    net: number;
  }>;
  incomeComposition: {
    labels: string[];
    data: number[];
  };
  topPartners: Array<{
    name: string;
    totalRevenue: number;
  }>;
}

export default function DashboardCharts({
  cashflowTrend,
  incomeComposition,
  topPartners,
}: DashboardChartsProps) {
  // 1. Cashflow Trend Chart Data
  const cashflowData = {
    labels: cashflowTrend.map((t) => t.label),
    datasets: [
      {
        type: "line" as const,
        label: "Pemasukan (Income)",
        data: cashflowTrend.map((t) => t.income),
        borderColor: "#1E69DE",
        backgroundColor: "rgba(30, 105, 222, 0.12)",
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: "#1E69DE",
        pointRadius: 4,
      },
      {
        type: "line" as const,
        label: "Pengeluaran (Expense)",
        data: cashflowTrend.map((t) => t.expense),
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.08)",
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: "#EF4444",
        pointRadius: 3,
        borderDash: [5, 5],
      },
    ],
  };

  const cashflowOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: "sans-serif", size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            return ` ${context.dataset.label}: ${formatRupiah(val)}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)} jt`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)} rb`;
            return value;
          },
          font: { size: 11 },
        },
        grid: {
          color: "#F1F5F9",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
        },
      },
    },
  };

  // 2. Income Composition Doughnut Data
  const doughnutData = {
    labels: incomeComposition.labels,
    datasets: [
      {
        data: incomeComposition.data,
        backgroundColor: [
          "#0B4EA2", // Voucher Hotspot (Royal Blue)
          "#1E69DE", // Tagihan Rumahan (Tech Blue)
          "#10B981", // Biaya Pasang Baru (Emerald)
          "#F59E0B", // Lainnya (Amber)
        ],
        borderWidth: 2,
        borderColor: "#FFFFFF",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 11 },
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            return ` ${context.label}: ${formatRupiah(val)}`;
          },
        },
      },
    },
    cutout: "68%",
  };

  // 3. Top 5 Hotspot Partners Horizontal Bar
  const topPartnerData = {
    labels: topPartners.map((p) => p.name),
    datasets: [
      {
        label: "Total Setoran",
        data: topPartners.map((p) => p.totalRevenue),
        backgroundColor: "#0B4EA2",
        hoverBackgroundColor: "#1E69DE",
        borderRadius: 6,
      },
    ],
  };

  const topPartnerOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return ` Total Setoran: ${formatRupiah(context.raw)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value: any) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)} jt`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)} rb`;
            return value;
          },
          font: { size: 10 },
        },
        grid: {
          color: "#F1F5F9",
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11, weight: "bold" as const },
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cashflow Trend Line Chart (Span 2 cols) */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#072255]">
              Arus Kas Bulanan (Cashflow Trend)
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan tren Pemasukan vs Pengeluaran operasional & modal
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-[#0B4EA2] border border-blue-100 w-fit">
            6 Bulan Terakhir
          </span>
        </div>
        <div className="h-72 w-full">
          <Line data={cashflowData} options={cashflowOptions} />
        </div>
      </div>

      {/* Income Composition Doughnut (Span 1 col) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col">
        <div className="pb-4 mb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-[#072255]">
            Komposisi Pendapatan
          </h3>
          <p className="text-xs text-slate-500">
            Distribusi sumber pemasukan utama
          </p>
        </div>
        <div className="h-64 w-full flex-1 relative flex items-center justify-center">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      {/* Top 5 Hotspot Partners (Span full 3 cols) */}
      <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#072255]">
              Top 5 Titik Hotspot / Warung Setoran Tertinggi
            </h3>
            <p className="text-xs text-slate-500">
              Peringkat mitra warung dengan kontribusi setoran voucher terbesar
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Berdasarkan Riwayat Transaksi
          </span>
        </div>
        <div className="h-56 w-full">
          {topPartners.length > 0 ? (
            <Bar data={topPartnerData} options={topPartnerOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              Belum ada data setoran dari mitra warung.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
