"use client";

import { useState } from "react";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { deleteFinancialTransaction } from "@/actions/finance-actions";
import AddTransactionModal from "./AddTransactionModal";
import ConfirmDialog, { ConfirmVariant } from "@/components/ui/ConfirmDialog";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Filter,
  Calendar,
  Search,
  Trash2,
  FileText,
  TrendingUp,
  Receipt,
  Zap,
  Radio,
  Server,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TransactionType, FinancialCategory } from "@prisma/client";

interface FinanceClientViewProps {
  transactions: any[];
  summary: {
    kasBersihTotal: number;
    totalIncomeAll: number;
    totalExpenseAll: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyNet: number;
    monthlyVoucher: number;
    monthlyCustomer: number;
    monthlyInstallation: number;
    targetYear: number;
    targetMonth: number;
  };
}

export default function FinanceClientView({
  transactions,
  summary,
}: FinanceClientViewProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Custom Confirm Card State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: ConfirmVariant;
    action?: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const handleRefresh = () => {
    router.refresh();
  };

  const handleDelete = (id: string, description: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Transaksi Kas",
      description: `Apakah Anda yakin ingin menghapus catatan kas: "${description}"? Saldo kas bersih akan dihitung ulang secara otomatis.`,
      confirmText: "Hapus Transaksi",
      variant: "danger",
      action: async () => {
        try {
          setDeletingId(id);
          await deleteFinancialTransaction(id);
          handleRefresh();
        } finally {
          setDeletingId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
    const matchesCategory = categoryFilter === "ALL" || tx.category === categoryFilter;

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(tx.transactionDate) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(tx.transactionDate) <= end;
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  const getCategoryLabel = (cat: FinancialCategory) => {
    switch (cat) {
      case FinancialCategory.VOUCHER_HOTSPOT:
        return { label: "Setoran Voucher Hotspot", color: "bg-blue-50 text-[#0B4EA2] border-blue-200" };
      case FinancialCategory.MONTHLY_BILLING:
        return { label: "Tagihan Bulanan Rumahan", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case FinancialCategory.INSTALLATION_FEE:
        return { label: "Biaya Pasang Baru", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case FinancialCategory.ISP_BANDWIDTH:
        return { label: "Bandwidth ISP Hulu (OpEx)", color: "bg-rose-50 text-rose-700 border-rose-200" };
      case FinancialCategory.ELECTRICITY_TOKEN:
        return { label: "Listrik / PLN POP (OpEx)", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case FinancialCategory.SALARY:
        return { label: "Gaji Karyawan / Teknisi", color: "bg-teal-50 text-teal-700 border-teal-200" };
      case FinancialCategory.MAINTENANCE:
        return { label: "Maintenance & Operasional", color: "bg-slate-100 text-slate-700 border-slate-200" };
      case FinancialCategory.HARDWARE_PURCHASE:
        return { label: "Beli Alat / Kabel (CapEx)", color: "bg-cyan-50 text-cyan-800 border-cyan-200" };
      case FinancialCategory.OTHER_INCOME:
        return { label: "Pemasukan Lainnya", color: "bg-green-50 text-green-700 border-green-200" };
      case FinancialCategory.OTHER_EXPENSE:
        return { label: "Pengeluaran Lainnya", color: "bg-rose-50 text-rose-700 border-rose-200" };
      default:
        return { label: cat, color: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6">
      {/* P&L Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kas Bersih */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Kas Bersih (All Time)
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#072255]">
            {formatRupiah(summary.kasBersihTotal)}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Masuk: {formatRupiah(summary.totalIncomeAll)}</span>
            <span>Keluar: {formatRupiah(summary.totalExpenseAll)}</span>
          </div>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pemasukan Bulan Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {formatRupiah(summary.monthlyIncome)}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Voucher: {formatRupiah(summary.monthlyVoucher)}</span>
            <span>Tagihan: {formatRupiah(summary.monthlyCustomer)}</span>
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pengeluaran Bulan Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">
            {formatRupiah(summary.monthlyExpense)}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            OpEx Bandwidth, Listrik & Maintenance
          </div>
        </div>

        {/* Laba Bersih Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Laba Bersih Bulan Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-black ${
              summary.monthlyNet >= 0 ? "text-purple-800" : "text-rose-600"
            }`}
          >
            {formatRupiah(summary.monthlyNet)}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Pemasukan - Pengeluaran bulan berjalan
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Add Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari keterangan transaksi, nama mitra, dll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-slate-50/50"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20 w-fit"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Kas (OpEx / CapEx / Income)</span>
          </button>
        </div>

        {/* Detailed Filters: Type, Category, Date Range */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
          >
            <option value="ALL">Semua Jenis Kas</option>
            <option value="INCOME">🟢 Pemasukan (Income)</option>
            <option value="EXPENSE">🔴 Pengeluaran (Expense)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
          >
            <option value="ALL">Semua Kategori</option>
            <option value={FinancialCategory.VOUCHER_HOTSPOT}>Setoran Voucher Hotspot</option>
            <option value={FinancialCategory.MONTHLY_BILLING}>Tagihan Bulanan Rumahan</option>
            <option value={FinancialCategory.INSTALLATION_FEE}>Biaya Pasang Baru</option>
            <option value={FinancialCategory.ISP_BANDWIDTH}>Bandwidth ISP Hulu (OpEx)</option>
            <option value={FinancialCategory.ELECTRICITY_TOKEN}>Listrik / Token POP (OpEx)</option>
            <option value={FinancialCategory.SALARY}>Gaji Karyawan / Teknisi (OpEx)</option>
            <option value={FinancialCategory.MAINTENANCE}>Maintenance & Operasional</option>
            <option value={FinancialCategory.HARDWARE_PURCHASE}>Beli Alat / Kabel (CapEx)</option>
            <option value={FinancialCategory.OTHER_INCOME}>Pemasukan Lainnya</option>
            <option value={FinancialCategory.OTHER_EXPENSE}>Pengeluaran Lainnya</option>
          </select>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
            />
            <span className="text-slate-400">s/d:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
            />
            {(startDate || endDate || typeFilter !== "ALL" || categoryFilter !== "ALL") && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setTypeFilter("ALL");
                  setCategoryFilter("ALL");
                }}
                className="text-[11px] text-rose-600 hover:underline font-semibold ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* General Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Tanggal & Metode</th>
                <th className="py-3 px-4">Kategori Akun</th>
                <th className="py-3 px-4">Deskripsi / Keterangan</th>
                <th className="py-3 px-4 text-right">Nominal Arus Kas</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi kas yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === TransactionType.INCOME;
                  const catInfo = getCategoryLabel(tx.category);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {formatDateIndo(tx.transactionDate)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {tx.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold border inline-block ${catInfo.color}`}
                        >
                          {catInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block text-xs">
                          {tx.description}
                        </span>
                        {tx.settlement && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Ref: Settlement #{tx.settlement.id.slice(0, 8)}
                          </span>
                        )}
                        {tx.invoice && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Ref: Invoice #{tx.invoice.id.slice(0, 8)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-black text-sm ${
                            isIncome ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isIncome ? "+" : "-"} {formatRupiah(tx.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!tx.settlementId && !tx.invoiceId && (
                          <button
                            onClick={() => handleDelete(tx.id, tx.description)}
                            disabled={deletingId === tx.id}
                            className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-auto"
                            title="Hapus Transaksi Manual"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Custom Confirmation Modal Card */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={Boolean(deletingId)}
        onConfirm={() => confirmDialog.action && confirmDialog.action()}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
