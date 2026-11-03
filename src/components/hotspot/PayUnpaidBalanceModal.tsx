"use client";

import { useState } from "react";
import { payPartnerUnpaidBalance } from "@/actions/voucher-actions";
import { X, HandCoins, AlertCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";

interface PayUnpaidBalanceModalProps {
  partner: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PayUnpaidBalanceModal({
  partner,
  onClose,
  onSuccess,
}: PayUnpaidBalanceModalProps) {
  const [amount, setAmount] = useState<number | string>(partner.unpaidBalance);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = Number(amount);

    if (num <= 0) {
      setError("Jumlah pembayaran harus lebih dari 0");
      return;
    }

    try {
      setLoading(true);
      await payPartnerUnpaidBalance({
        partnerId: partner.id,
        amount: num,
        paymentMethod,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal mencatat pelunasan piutang");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Pelunasan Piutang Warung</h3>
              <p className="text-xs text-slate-500">
                Mitra: <span className="font-semibold text-slate-800">{partner.name}</span>
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
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex justify-between items-center text-amber-800">
            <span>Sisa Piutang Saat Ini:</span>
            <span className="font-black text-sm">{formatRupiah(partner.unpaidBalance)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal yang Dibayarkan (Rp)
            </label>
            <input
              type="number"
              min="1"
              max={partner.unpaidBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
            >
              <option value={PaymentMethod.CASH}>Tunai (Cash)</option>
              <option value={PaymentMethod.TRANSFER}>Transfer Bank / E-Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Diterima lunas tunai oleh teknisi di warung"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-emerald-700/20"
            >
              {loading ? "Menyimpan..." : "Bukukan Pelunasan Kas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
