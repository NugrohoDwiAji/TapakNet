"use client";

import { useState } from "react";
import { updateInventoryDevice } from "@/actions/infrastructure-actions";
import { X, Edit3, AlertCircle } from "lucide-react";
import { DeviceCategory, DeviceStatus } from "@prisma/client";

interface EditDeviceModalProps {
  device: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface DeviceEditFormData {
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

export default function EditDeviceModal({
  device,
  onClose,
  onSuccess,
}: EditDeviceModalProps) {
  const [formData, setFormData] = useState<DeviceEditFormData>({
    category: device.category as DeviceCategory,
    customCategory: device.customCategory || "",
    brandModel: device.brandModel,
    serialNumber: device.serialNumber,
    macAddress: device.macAddress || "",
    purchaseDate: device.purchaseDate
      ? new Date(device.purchaseDate).toISOString().slice(0, 10)
      : "",
    purchasePrice: device.purchasePrice ? device.purchasePrice.toString() : "0",
    status: device.status as DeviceStatus,
    notes: device.notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.category === DeviceCategory.OTHER && !formData.customCategory.trim()) {
      setError("Silakan isi nama kategori manual untuk perangkat ini");
      return;
    }

    try {
      setLoading(true);
      await updateInventoryDevice(device.id, {
        category: formData.category,
        customCategory:
          formData.category === DeviceCategory.OTHER
            ? formData.customCategory.trim()
            : undefined,
        brandModel: formData.brandModel,
        serialNumber: formData.serialNumber.trim().toUpperCase(),
        macAddress: formData.macAddress.trim() || undefined,
        purchaseDate: formData.purchaseDate || null,
        purchasePrice: Number(formData.purchasePrice || 0),
        status: formData.status,
        notes: formData.notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui data perangkat");
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
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Edit Perangkat</h3>
              <p className="text-xs text-slate-500 font-mono">SN: {device.serialNumber}</p>
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
                <option value={DeviceCategory.ODP}>Kotak ODP (Splitter Box)</option>
                <option value={DeviceCategory.ONT}>ONT / Modem Fiber</option>
                <option value={DeviceCategory.AP_OUTDOOR}>AP Outdoor / Wireless</option>
                <option value={DeviceCategory.ROUTER}>Router / MikroTik</option>
                <option value={DeviceCategory.SWITCH}>Switch Hub</option>
                <option value={DeviceCategory.CONVERTER}>Converter HTB</option>
                <option value={DeviceCategory.OTHER}>Lainnya (Input Kategori Manual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Perangkat *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as DeviceStatus })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white font-semibold"
              >
                <option value={DeviceStatus.IN_STOCK}>IN_STOCK (Ready di Gudang)</option>
                <option value={DeviceStatus.DEPLOYED_INFRA}>DEPLOYED_INFRA (Terpasang OLT/ODP)</option>
                <option value={DeviceStatus.DEPLOYED_HOME}>DEPLOYED_HOME (Terpasang Pelanggan)</option>
                <option value={DeviceStatus.DEPLOYED_HOTSPOT}>DEPLOYED_HOTSPOT (Terpasang Hotspot)</option>
                <option value={DeviceStatus.BROKEN}>BROKEN (Rusak / Afkir)</option>
                <option value={DeviceStatus.INACTIVE}>INACTIVE (Non Aktif)</option>
              </select>
            </div>
          </div>

          {formData.category === DeviceCategory.OTHER && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
              <label className="block text-xs font-semibold text-amber-900">
                Nama Kategori Manual *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Tang Crimping, Splicer, Stripper, Roll FO, dll"
                value={formData.customCategory}
                onChange={(e) =>
                  setFormData({ ...formData, customCategory: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
              />
              <p className="text-[11px] text-amber-700">
                Kategori ini akan disimpan sebagai identitas khusus perangkat inventaris.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merk & Seri / Model *
              </label>
              <input
                type="text"
                required
                value={formData.brandModel}
                onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serial Number (SN) *
              </label>
              <input
                type="text"
                required
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
                MAC Address
              </label>
              <input
                type="text"
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
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
              <p className="text-[10px] text-emerald-600 font-medium mt-1">
                Otomatis sinkron ke Pengeluaran Buku Kas & Keuangan.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Posisi Rak Gudang
            </label>
            <input
              type="text"
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
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
