"use client";

import { useState } from "react";
import { createOltDevice } from "@/actions/infrastructure-actions";
import { X, Server, AlertCircle, HardDrive, CheckCircle2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface AddOltModalProps {
  availableDevices?: any[];
  routers?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddOltModal({
  availableDevices = [],
  routers = [],
  onClose,
  onSuccess,
}: AddOltModalProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    brandModel: "",
    localIp: "",
    ponPortsCount: "4",
    location: "",
    routerId: routers[0]?.id || "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter in-stock devices
  const inStockDevices = availableDevices.filter((d) => d.status === "IN_STOCK");
  const oltDevices = inStockDevices.filter((d) => d.category === "OLT");
  const otherDevices = inStockDevices.filter((d) => d.category !== "OLT");

  const selectedDevice = inStockDevices.find((d) => d.id === selectedDeviceId);

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (!deviceId) return;

    const dev = inStockDevices.find((d) => d.id === deviceId);
    if (dev) {
      setFormData((prev) => ({
        ...prev,
        brandModel: dev.brandModel,
        name: prev.name.trim() === "" ? `OLT ${dev.brandModel}` : prev.name,
        notes: prev.notes || (dev.notes ? `Unit SN ${dev.serialNumber}: ${dev.notes}` : ""),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await createOltDevice({
        name: formData.name,
        brandModel: formData.brandModel,
        localIp: formData.localIp || undefined,
        ponPortsCount: Number(formData.ponPortsCount),
        location: formData.location,
        routerId: formData.routerId || undefined,
        notes: formData.notes || undefined,
        inventoryDeviceId: selectedDeviceId || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menambah data OLT");
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
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Tambah Master OLT</h3>
              <p className="text-xs text-slate-500">
                Ambil perangkat fisik dari inventaris gudang atau input manual
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
                <span>Pilih Unit dari Inventaris Gudang</span>
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
              <option value="">-- [Rekomendasi] Pilih Perangkat dari Gudang --</option>
              {oltDevices.length > 0 && (
                <optgroup label="⭐ Kategori OLT (Khusus Master OLT)">
                  {oltDevices.map((d) => (
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
              <option value="">-- Atau Input Manual (Tanpa Unit Gudang) --</option>
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
                Pilih unit hardware dari gudang agar merk, model, dan serial number terisi otomatis serta tercatat rapi.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama OLT *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: OLT ZTE C320 NOC Utama"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merk & Model *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: ZTE C320 / HSGQ"
                value={formData.brandModel}
                onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Port PON *
              </label>
              <input
                type="number"
                min="1"
                max="32"
                required
                value={formData.ponPortsCount}
                onChange={(e) => setFormData({ ...formData, ponPortsCount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                IP Manajemen Lokal
              </label>
              <input
                type="text"
                placeholder="192.168.10.2"
                value={formData.localIp}
                onChange={(e) => setFormData({ ...formData, localIp: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Fisik Server *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: NOC Ruang Server"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Terhubung ke Router / POP
            </label>
            <select
              value={formData.routerId}
              onChange={(e) => setFormData({ ...formData, routerId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white font-medium"
            >
              <option value="">-- Tanpa Router / Core Default --</option>
              {routers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.siteLocation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Konfigurasi (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Uplink SFP 1G ke Core MikroTik port sfp1"
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
              {loading ? "Menyimpan..." : "Simpan OLT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
