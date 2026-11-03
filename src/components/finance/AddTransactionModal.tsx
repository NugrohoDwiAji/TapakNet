"use client";

import { useState } from "react";
import { createManualTransaction } from "@/actions/finance-actions";
import { X, PlusCircle, AlertCircle } from "lucide-react";
import { TransactionType, FinancialCategory, PaymentMethod } from "@prisma/client";

interface AddTransactionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface TransactionFormData {
  type: TransactionType;
  category: FinancialCategory;
  amount: string;
  transactionDate: string;
  description: string;
  paymentMethod: PaymentMethod;
}

export default function AddTransactionModal({
  onClose,
  onSuccess,
}: AddTransactionModalProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: TransactionType.EXPENSE,
    category: FinancialCategory.ISP_BANDWIDTH,
    amount: "",
    transactionDate: new Date().toISOString().slice(0, 10),
    description: "",
    paymentMethod: PaymentMethod.TRANSFER,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (type: TransactionType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      category:
        type === TransactionType.INCOME
          ? FinancialCategory.OTHER_INCOME
          : FinancialCategory.ISP_BANDWIDTH,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amountNum = Number(formData.amount);

    if (amountNum <= 0) {
      setError("Nominal transaksi harus lebih dari 0");
      return;
    }

    try {
      setLoading(true);
      await createManualTransaction({
        type: formData.type,
        category: formData.category,
        amount: amountNum,
        transactionDate: formData.transactionDate,
        description: formData.description,
        paymentMethod: formData.paymentMethod,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal mencatat transaksi kas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Catat Kas Manual (Jurnal)</h3>
              <p className="text-xs text-slate-500">
                Pencatatan biaya operasional (OpEx), modal (CapEx) & pendapatan lain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Transaction Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Arus Kas *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange(TransactionType.EXPENSE)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  formData.type === TransactionType.EXPENSE
                    ? "bg-rose-50 border-rose-300 text-rose-700 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>🔴 Pengeluaran (Expense / Biaya)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange(TransactionType.INCOME)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  formData.type === TransactionType.INCOME
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>🟢 Pemasukan (Income)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Transaksi *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as FinancialCategory })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
              >
                {formData.type === TransactionType.EXPENSE ? (
                  <>
                    <option value={FinancialCategory.ISP_BANDWIDTH}>
                      Bandwidth ISP Hulu (OpEx)
                    </option>
                    <option value={FinancialCategory.ELECTRICITY_TOKEN}>
                      Listrik / Token PLN POP (OpEx)
                    </option>
                    <option value={FinancialCategory.SALARY}>
                      Gaji Karyawan / Teknisi (OpEx)
                    </option>
                    <option value={FinancialCategory.MAINTENANCE}>
                      Maintenance & Operasional (OpEx)
                    </option>
                    <option value={FinancialCategory.HARDWARE_PURCHASE}>
                      Beli Alat / Kabel / ONT (CapEx)
                    </option>
                    <option value={FinancialCategory.OTHER_EXPENSE}>Pengeluaran Lainnya</option>
                  </>
                ) : (
                  <>
                    <option value={FinancialCategory.INSTALLATION_FEE}>
                      Biaya Pasang Baru Pelanggan
                    </option>
                    <option value={FinancialCategory.VOUCHER_HOTSPOT}>
                      Setoran Voucher Hotspot
                    </option>
                    <option value={FinancialCategory.MONTHLY_BILLING}>
                      Tagihan Bulanan Rumahan
                    </option>
                    <option value={FinancialCategory.OTHER_INCOME}>Pemasukan Lainnya</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Transaksi (Rp) *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="Contoh: 350000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi *
              </label>
              <input
                type="date"
                required
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white font-semibold"
              >
                <option value={PaymentMethod.TRANSFER}>Transfer Bank / QRIS</option>
                <option value={PaymentMethod.CASH}>Tunai (Cash)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Deskripsi Transaksi *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Contoh: Beli 1 Roll Kabel Dropcore 1000m & 50 pcs Fast Connector FO"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B4EA2] hover:bg-blue-800 rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-blue-900/20"
            >
              {loading ? "Menyimpan..." : "Simpan ke Buku Kas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
