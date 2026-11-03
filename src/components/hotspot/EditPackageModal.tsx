"use client";

import { useState } from "react";
import { updateVoucherPackage } from "@/actions/voucher-actions";
import { X, Settings2, AlertCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface EditPackageModalProps {
  pkg: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPackageModal({
  pkg,
  onClose,
  onSuccess,
}: EditPackageModalProps) {
  const [formData, setFormData] = useState({
    name: pkg.name,
    sellPrice: pkg.sellPrice.toString(),
    defaultOwnerShare: pkg.defaultOwnerShare.toString(),
    defaultPartnerFee: pkg.defaultPartnerFee.toString(),
    isActive: pkg.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto calculate partner fee when sell price and owner share are modified
  const handleOwnerShareChange = (val: string) => {
    const owner = Number(val) || 0;
    const sell = Number(formData.sellPrice) || 0;
    const fee = Math.max(0, sell - owner);
    setFormData((prev) => ({
      ...prev,
      defaultOwnerShare: val,
      defaultPartnerFee: fee.toString(),
    }));
  };

  const handleSellPriceChange = (val: string) => {
    const sell = Number(val) || 0;
    const owner = Number(formData.defaultOwnerShare) || 0;
    const fee = Math.max(0, sell - owner);
    setFormData((prev) => ({
      ...prev,
      sellPrice: val,
      defaultPartnerFee: fee.toString(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sell = Number(formData.sellPrice);
    const owner = Number(formData.defaultOwnerShare);
    const fee = Number(formData.defaultPartnerFee);

    if (sell <= 0 || owner <= 0) {
      setError("Harga jual dan setoran owner harus lebih besar dari 0");
      return;
    }

    try {
      setLoading(true);
      await updateVoucherPackage(pkg.id, {
        name: formData.name.trim(),
        sellPrice: sell,
        defaultOwnerShare: owner,
        defaultPartnerFee: fee,
        isActive: formData.isActive,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui paket voucher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-100">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#072255]">
                Edit Paket Voucher
              </h3>
              <p className="text-xs text-slate-500">{pkg.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
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
              Nama Paket Voucher *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Voucher 2.000 (1 Hari)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Jual ke User (Rp) *
              </label>
              <input
                type="number"
                required
                min="100"
                value={formData.sellPrice}
                onChange={(e) => handleSellPriceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hak Setor Owner (Rp) *
              </label>
              <input
                type="number"
                required
                min="100"
                value={formData.defaultOwnerShare}
                onChange={(e) => handleOwnerShareChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#0B4EA2] focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fee Warung / Mitra (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={formData.defaultPartnerFee}
              onChange={(e) =>
                setFormData({ ...formData, defaultPartnerFee: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Keuntungan warung per lembar voucher yang berhasil terjual.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Status Paket</span>
              <span className="text-[11px] text-slate-500">
                {formData.isActive
                  ? "Paket ini aktif dan dapat didistribusikan ke warung"
                  : "Paket dinonaktifkan dari peredaran baru"}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B4EA2]"></div>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B4EA2] hover:bg-blue-800 rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-blue-900/20"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
