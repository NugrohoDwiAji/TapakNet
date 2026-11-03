"use client";

import { useState } from "react";
import { createOdpNode } from "@/actions/infrastructure-actions";
import { X, Radio, AlertCircle, HardDrive, CheckCircle2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface AddOdpModalProps {
  olts: any[];
  availableDevices?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddOdpModal({
  olts,
  availableDevices = [],
  onClose,
  onSuccess,
}: AddOdpModalProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [formData, setFormData] = useState({
    code: "",
    oltId: olts[0]?.id || "",
    ponPortNumber: "1",
    splitterCapacity: "8",
    coordinates: "",
    opticalPowerDbm: "-18.0",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter in-stock devices
  const inStockDevices = availableDevices.filter((d) => d.status === "IN_STOCK");
  const odpDevices = inStockDevices.filter((d) => d.category === "ODP");
  const otherDevices = inStockDevices.filter((d) => d.category !== "ODP");

  const selectedDevice = inStockDevices.find((d) => d.id === selectedDeviceId);

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (!deviceId) return;

    const dev = inStockDevices.find((d) => d.id === deviceId);
    if (dev) {
      // Auto adjust splitter capacity if mentioned in model/notes
      let capacity = formData.splitterCapacity;
      const desc = `${dev.brandModel} ${dev.notes || ""}`.toLowerCase();
      if (desc.includes("1:16") || desc.includes("16 port") || desc.includes("16p")) {
        capacity = "16";
      } else if (desc.includes("1:24") || desc.includes("24 port")) {
        capacity = "24";
      } else if (desc.includes("1:4") || desc.includes("4 port")) {
        capacity = "4";
      } else if (desc.includes("1:8") || desc.includes("8 port")) {
        capacity = "8";
      }

      setFormData((prev) => ({
        ...prev,
        splitterCapacity: capacity,
        notes: prev.notes || (dev.notes ? `Unit SN ${dev.serialNumber}: ${dev.notes}` : ""),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await createOdpNode({
        code: formData.code,
        oltId: formData.oltId || undefined,
        ponPortNumber: Number(formData.ponPortNumber),
        splitterCapacity: Number(formData.splitterCapacity),
        coordinates: formData.coordinates || undefined,
        opticalPowerDbm: formData.opticalPowerDbm ? Number(formData.opticalPowerDbm) : undefined,
        notes: formData.notes || undefined,
        inventoryDeviceId: selectedDeviceId || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menambah data ODP");
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
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Tambah Master ODP</h3>
              <p className="text-xs text-slate-500">
                Ambil kotak ODP dari inventaris gudang atau input manual
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
          {/* Warehouse Device Selector */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#072255] flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-[#0B4EA2]" />
                <span>Pilih Kotak ODP dari Inventaris Gudang</span>
              </label>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                {inStockDevices.length} Unit Ready
              </span>
            </div>

            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white text-slate-800"
            >
              <option value="">-- [Rekomendasi] Pilih Box ODP dari Gudang --</option>
              {odpDevices.length > 0 && (
                <optgroup label="⭐ Kategori ODP (Kotak Splitter Distribusi)">
                  {odpDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.brandModel} | SN: {d.serialNumber} {d.purchasePrice ? `(${formatRupiah(d.purchasePrice)})` : ""}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherDevices.length > 0 && (
                <optgroup label="Perangkat Lain di Gudang">
                  {otherDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.category}] {d.brandModel} | SN: {d.serialNumber}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="">-- Atau Input Manual (Tanpa Box Gudang) --</option>
            </select>

            {selectedDevice ? (
              <div className="p-2.5 rounded-xl bg-white border border-blue-200 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Unit siap dialokasikan: {selectedDevice.brandModel}
                  </span>
                  <span className="font-mono font-bold text-[#0B4EA2]">SN: {selectedDevice.serialNumber}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Status alat di gudang akan otomatis berubah menjadi <strong className="text-purple-700 font-semibold">DEPLOYED_INFRA</strong>.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Pilih unit kotak ODP dari gudang agar tercatat pada aset jaringan tiang.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode ODP *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: ODP-04-MASJID"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kapasitas Splitter *
              </label>
              <select
                value={formData.splitterCapacity}
                onChange={(e) => setFormData({ ...formData, splitterCapacity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white font-semibold"
              >
                <option value="8">8 Port (Splitter 1:8)</option>
                <option value="16">16 Port (Splitter 1:16)</option>
                <option value="4">4 Port (Splitter 1:4)</option>
                <option value="24">24 Port (Splitter 1:24)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Terhubung ke OLT
              </label>
              <select
                value={formData.oltId}
                onChange={(e) => setFormData({ ...formData, oltId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
              >
                <option value="">-- Tanpa OLT / Direct --</option>
                {olts.map((olt) => (
                  <option key={olt.id} value={olt.id}>
                    {olt.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Port PON OLT
              </label>
              <input
                type="number"
                min="1"
                max="32"
                value={formData.ponPortNumber}
                onChange={(e) => setFormData({ ...formData, ponPortNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Redaman Optik ODP (dBm)
              </label>
              <input
                type="text"
                placeholder="-18.2"
                value={formData.opticalPowerDbm}
                onChange={(e) => setFormData({ ...formData, opticalPowerDbm: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Koordinat Tiang (GPS)
              </label>
              <input
                type="text"
                placeholder="-8.5833, 116.1167"
                value={formData.coordinates}
                onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tiang / Patokan Lokasi
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Tiang PLN depan Gapura Musholla Al-Ikhlas"
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
              {loading ? "Menyimpan..." : "Simpan ODP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
