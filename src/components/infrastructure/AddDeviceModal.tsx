"use client";

import { useState } from "react";
import { createInventoryDevice } from "@/actions/infrastructure-actions";
import { X, HardDrive, AlertCircle, Wand2, CheckCircle2 } from "lucide-react";
import { DeviceCategory, DeviceStatus } from "@prisma/client";

interface AddDeviceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface DeviceFormData {
  category: DeviceCategory;
  customCategory: string;
  brandModel: string;
  serialNumber: string;
  macAddress: string;
  purchaseDate: string;
  purchasePrice: string;
  status: DeviceStatus;
  notes: string;
}

export default function AddDeviceModal({ onClose, onSuccess }: AddDeviceModalProps) {
  const [formData, setFormData] = useState<DeviceFormData>({
    category: DeviceCategory.ONT,
    customCategory: "",
    brandModel: "",
    serialNumber: "",
    macAddress: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchasePrice: "195000",
    status: DeviceStatus.IN_STOCK,
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRandomSN = () => {
    const prefix =
      formData.category === DeviceCategory.OTHER
        ? "EQ"
        : formData.category;
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dateStamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    setFormData((prev) => ({
      ...prev,
      serialNumber: `${prefix}-${dateStamp}-${randomHex}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.category === DeviceCategory.OTHER && !formData.customCategory.trim()) {
      setError("Silakan isi nama kategori manual untuk kategori 'Lainnya'.");
      return;
    }

    try {
      setLoading(true);
      await createInventoryDevice({
        category: formData.category,
        customCategory:
          formData.category === DeviceCategory.OTHER
            ? formData.customCategory.trim()
            : undefined,
        brandModel: formData.brandModel,
        serialNumber: formData.serialNumber,
        macAddress: formData.macAddress || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchasePrice: Number(formData.purchasePrice || 0),
        status: formData.status,
        notes: formData.notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal mencatat perangkat inventaris");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Tambah Perangkat / Alat</h3>
              <p className="text-xs text-slate-500">
                Inventarisasi perangkat gudang & catat otomatis ke buku kas
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Perangkat *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as DeviceCategory })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white font-semibold"
              >
                <option value={DeviceCategory.OLT}>Master OLT (Optical Line Terminal)</option>
                <option value={DeviceCategory.ODP}>Kotak ODP (Splitter Box Distribusi)</option>
                <option value={DeviceCategory.ONT}>ONT / Modem Fiber (GPON/EPON)</option>
                <option value={DeviceCategory.AP_OUTDOOR}>AP Outdoor / Radio Wireless</option>
                <option value={DeviceCategory.ROUTER}>Router / MikroTik</option>
                <option value={DeviceCategory.SWITCH}>Switch Hub / Managed Switch</option>
                <option value={DeviceCategory.CONVERTER}>Media Converter (HTB)</option>
                <option value={DeviceCategory.OTHER}>Lainnya (Input Kategori Manual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Saat Ini *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as DeviceStatus })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white font-semibold"
              >
                <option value={DeviceStatus.IN_STOCK}>IN_STOCK (Ready di Gudang)</option>
                <option value={DeviceStatus.DEPLOYED_INFRA}>DEPLOYED_INFRA (Terpasang di OLT/ODP)</option>
                <option value={DeviceStatus.DEPLOYED_HOME}>DEPLOYED_HOME (Terpasang Pelanggan)</option>
                <option value={DeviceStatus.DEPLOYED_HOTSPOT}>DEPLOYED_HOTSPOT (Terpasang Hotspot)</option>
                <option value={DeviceStatus.BROKEN}>BROKEN (Rusak / Afkir)</option>
              </select>
            </div>
          </div>

          {/* Input Kategori Manual jika memilih Lainnya */}
          {formData.category === DeviceCategory.OTHER && (
            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-xs font-bold text-[#072255] mb-1">
                Nama Kategori Lainnya (Input Manual) *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Tang Crimping, Klem Dropcore, SFP Bidi, Roll Kabel FO, dll."
                value={formData.customCategory}
                onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-blue-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] font-semibold"
              />
              <p className="text-[11px] text-[#0B4EA2] mt-1">
                Kategori ini akan tersimpan dan tampil pada daftar inventaris serta buku kas keuangan.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merk & Seri / Model / Nama Alat *
              </label>
              <input
                type="text"
                required
                placeholder={
                  formData.category === DeviceCategory.OTHER
                    ? "Contoh: Tang Crimper Pro RJ45 / Klem Buaya S-Clamp"
                    : "Contoh: ZTE F609 V3 / TP-Link CPE220"
                }
                value={formData.brandModel}
                onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Serial Number (SN) *
                </label>
                <button
                  type="button"
                  onClick={generateRandomSN}
                  className="text-[11px] text-[#0B4EA2] hover:text-[#072255] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Generate kode unik otomatis untuk alat/material yang tidak memiliki nomor seri pabrik"
                >
                  <Wand2 className="w-3 h-3 text-[#0B4EA2]" />
                  <span>Acak SN (Alat/Material)</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Contoh: ZTEGC1234567 atau EQ-2026-X89"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value.toUpperCase() })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MAC Address (Opsional)
              </label>
              <input
                type="text"
                placeholder="B8:3A:5A:11:22:33"
                value={formData.macAddress}
                onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pembelian
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Beli (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  placeholder="195000"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
                />
              </div>
            </div>
          </div>

          {/* Notifikasi Otomatis Masuk ke Pengeluaran Buku Kas Keuangan */}
          {Number(formData.purchasePrice) > 0 ? (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Harga beli <strong>Rp {Number(formData.purchasePrice).toLocaleString("id-ID")}</strong> otomatis dicatat ke <strong>Pengeluaran Buku Kas & Keuangan (Pembelian Hardware)</strong>.
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              * Jika harga beli diisi &gt; 0, pengeluaran akan otomatis tercatat di modul Buku Kas & Keuangan.
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Posisi Rak Gudang (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Rak B-02, Box ONT Baru belum di-setting"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {loading ? "Menyimpan..." : "Simpan ke Gudang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
