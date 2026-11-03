"use client";

import { useState } from "react";
import { distributeVouchers } from "@/actions/voucher-actions";
import { PlusCircle, X, PackagePlus, AlertCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface DropVoucherModalProps {
  partner: any;
  packages: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function DropVoucherModal({
  partner,
  packages,
  onClose,
  onSuccess,
}: DropVoucherModalProps) {
  const [distributionDate, setDistributionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQtyChange = (pkgId: string, val: string) => {
    const qty = parseInt(val) || 0;
    setQuantities((prev) => ({ ...prev, [pkgId]: Math.max(0, qty) }));
  };

  const totalPcs = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (totalPcs === 0) {
      setError("Masukkan setidaknya 1 lembar voucher untuk di-drop");
      return;
    }

    try {
      setLoading(true);
      const items = Object.entries(quantities).map(([packageId, quantity]) => ({
        packageId,
        quantity,
      }));

      await distributeVouchers({
        partnerId: partner.id,
        distributionDate,
        notes,
        items,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal mencatat drop voucher");
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
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Drop Voucher Fisik</h3>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Drop / Kirim Voucher
            </label>
            <input
              type="date"
              value={distributionDate}
              onChange={(e) => setDistributionDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Input Jumlah Voucher per Paket (Lembar)
            </label>
            {packages.map((pkg) => {
              const currentStock =
                partner.stocks.find((s: any) => s.packageId === pkg.id)?.quantity || 0;
              return (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80"
                >
                  <div>
                    <div className="text-sm font-bold text-[#072255]">{pkg.name}</div>
                    <div className="text-xs text-slate-500">
                      Harga Jual: {formatRupiah(pkg.sellPrice)} • Stok saat ini:{" "}
                      <span className="font-semibold text-slate-700">{currentStock} pcs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">+</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={quantities[pkg.id] || ""}
                      onChange={(e) => handleQtyChange(pkg.id, e.target.value)}
                      className="w-24 px-3 py-1.5 text-center font-bold text-sm bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
                    />
                    <span className="text-xs text-slate-500">pcs</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Pengiriman (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Titip ke kasir Mas Bayu / Stok weekend"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              Total Drop: <span className="font-bold text-[#0B4EA2] text-sm">{totalPcs} pcs</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || totalPcs === 0}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B4EA2] hover:bg-blue-800 rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-blue-900/20"
              >
                {loading ? "Menyimpan..." : "Konfirmasi Drop Voucher"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
