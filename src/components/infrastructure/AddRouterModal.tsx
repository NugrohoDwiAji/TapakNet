"use client";

import { useState } from "react";
import { createRouterDevice } from "@/actions/infrastructure-actions";
import { X, Network, AlertCircle, HardDrive, CheckCircle2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface AddRouterModalProps {
  availableDevices?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddRouterModal({
  availableDevices = [],
  onClose,
  onSuccess,
}: AddRouterModalProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    brandModel: "MikroTik CCR2004",
    ipAddress: "192.168.10.1",
    siteLocation: "",
    isCoreGateway: false,
    apiPort: "8728",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter in-stock router devices
  const inStockDevices = availableDevices.filter((d) => d.status === "IN_STOCK");
  const routerStockDevices = inStockDevices.filter((d) => d.category === "ROUTER");
  const otherDevices = inStockDevices.filter((d) => d.category !== "ROUTER");

  const selectedDevice = inStockDevices.find((d) => d.id === selectedDeviceId);

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (!deviceId) return;

    const dev = inStockDevices.find((d) => d.id === deviceId);
    if (dev) {
      setFormData((prev) => ({
        ...prev,
        brandModel: dev.brandModel,
        name: prev.name.trim() === "" ? dev.brandModel : prev.name,
        notes: prev.notes || (dev.notes ? `Unit SN ${dev.serialNumber}: ${dev.notes}` : ""),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await createRouterDevice({
        name: formData.name,
        brandModel: formData.brandModel,
        ipAddress: formData.ipAddress || undefined,
        siteLocation: formData.siteLocation,
        isCoreGateway: formData.isCoreGateway,
        apiPort: Number(formData.apiPort || 8728),
        notes: formData.notes || undefined,
        inventoryDeviceId: selectedDeviceId || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menambah data Router MikroTik");
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
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Tambah Router MikroTik / POP</h3>
              <p className="text-xs text-slate-500">
                Pusat routing / gateway titik distribusi jaringan
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
                <span>Pilih Unit Router dari Inventaris Gudang</span>
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
              <option value="">-- [Rekomendasi] Ambil Unit dari Gudang --</option>
              {routerStockDevices.length > 0 && (
                <optgroup label="⭐ Kategori Router / MikroTik">
                  {routerStockDevices.map((d) => (
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
                Pilih unit router dari gudang agar inventaris serial number otomatis tertaut rapi.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Router / POP Site *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: MikroTik CCR2004 NOC Pusat / RB4011 POP Desa A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merk & Seri Model *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: MikroTik CCR2004-1G-12S+2XS"
                value={formData.brandModel}
                onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                IP Address Gateway / Manajemen
              </label>
              <input
                type="text"
                placeholder="192.168.10.1 atau 10.20.0.1"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Fisik / Titik POP *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: NOC Ruang Server / Tower POP Sukamaju"
                value={formData.siteLocation}
                onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Port API MikroTik
              </label>
              <input
                type="number"
                placeholder="8728"
                value={formData.apiPort}
                onChange={(e) => setFormData({ ...formData, apiPort: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="isCoreGateway"
              checked={formData.isCoreGateway}
              onChange={(e) => setFormData({ ...formData, isCoreGateway: e.target.checked })}
              className="w-4 h-4 text-[#0B4EA2] rounded focus:ring-[#0B4EA2]"
            />
            <label htmlFor="isCoreGateway" className="text-xs text-slate-700 cursor-pointer">
              <strong className="block text-[#072255]">Tandai sebagai Core Gateway Pusat (NOC)</strong>
              <span className="text-[11px] text-slate-500">
                Router ini adalah router utama jaringan yang menghubungkan ISP langsung.
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Info Interface (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: ether1 Uplink ISP Astinet, sfp-sfpplus1 Trunk VLAN ke OLT ZTE"
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
              {loading ? "Menyimpan..." : "Simpan Router"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
