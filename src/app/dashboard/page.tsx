import { getDashboardData } from "@/actions/dashboard-actions";
import { formatRupiah } from "@/lib/utils";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Receipt,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  Users,
  HardDrive,
  Network,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { kpis, cashflowTrend, incomeComposition, topPartners } = data;

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#072255] via-[#0B4EA2] to-[#1E69DE] p-6 rounded-3xl text-white shadow-xl shadow-blue-900/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-blue-200 border border-white/20">
              Overview Realtime
            </span>
            <span className="text-xs text-blue-200">
              {kpis.activeCustomersCount} Pelanggan Aktif • {kpis.totalPartnersCount} Mitra Warung
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mt-1 text-white">
            Pusat Kendali Keuangan & Jaringan RT/RW Net
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-xl">
            Sistem akuntansi kas, pembukuan konsinyasi voucher titik warung, tagihan bulanan PPPoE, dan dokumentasi kapasitas port FTTH.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/hotspot"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#072255] hover:bg-blue-50 font-semibold text-xs transition-colors shadow-sm"
          >
            <Wifi className="w-4 h-4 text-[#0B4EA2]" />
            <span>Setoran / Drop Voucher</span>
          </Link>

          <Link
            href="/customers"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs transition-colors"
          >
            <Users className="w-4 h-4 text-blue-200" />
            <span>Tagihan Pelanggan</span>
          </Link>

          <Link
            href="/finance"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-emerald-300" />
            <span>Catat Kas</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Kas Bersih */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Kas Bersih
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-100">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#072255] tracking-tight">
            {formatRupiah(kpis.totalKasBersih)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Akumulasi Kas Masuk - Pengeluaran
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Masuk: {formatRupiah(kpis.totalIncomeAll)}
            </span>
            <span className="text-rose-600 flex items-center gap-1 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" />
              Keluar: {formatRupiah(kpis.totalExpenseAll)}
            </span>
          </div>
        </div>

        {/* KPI 2: Pemasukan Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pemasukan Bulan Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatRupiah(kpis.pemasukanBulanIni)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pengeluaran: {formatRupiah(kpis.pengeluaranBulanIni)}
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>• Setoran Voucher:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(kpis.incomeVoucherBulanIni)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Tagihan Bulanan:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(kpis.incomeBulananBulanIni)}</span>
            </div>
            {kpis.incomePasangBaruBulanIni > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>• Biaya Pasang Baru:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(kpis.incomePasangBaruBulanIni)}</span>
              </div>
            )}
          </div>
        </div>

        {/* KPI 3: Total Piutang & Nilai Voucher di Warung */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Nilai Voucher di Lapangan
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            {formatRupiah(kpis.totalVoucherValueInField)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total hak owner di tangan mitra
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-500" />
                Piutang / Kurang Bayar:
              </span>
              <span className="font-bold text-rose-600">{formatRupiah(kpis.totalUnpaidBalance)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Sisa Stok Fisik Warung:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(kpis.totalConsignmentStockValue)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Aset Alat & Sisa Port ODP */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Aset Alat & Port ODP
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Network className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#072255] tracking-tight">
              {kpis.sisaPortOdp} Port
            </span>
            <span className="text-xs font-semibold text-emerald-600">Tersedia</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dari total {kpis.totalOdpCapacity} kapasitas splitter ODP
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>• Alat Ready (Gudang):</span>
              <span className="font-bold text-emerald-600">{kpis.devicesInStock} Unit</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Alat Terpasang:</span>
              <span className="font-semibold text-slate-800">{kpis.devicesDeployedTotal} Unit</span>
            </div>
            {kpis.devicesBroken > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>• Alat Rusak:</span>
                <span className="font-semibold text-rose-600">{kpis.devicesBroken} Unit</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart.js Visualizations Section */}
      <DashboardCharts
        cashflowTrend={cashflowTrend}
        incomeComposition={incomeComposition}
        topPartners={topPartners}
      />
    </div>
  );
}
