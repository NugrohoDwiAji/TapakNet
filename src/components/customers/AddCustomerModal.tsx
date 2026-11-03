"use client";

import { useState } from "react";
import { createHomeCustomer } from "@/actions/customer-actions";
import { X, UserPlus, AlertCircle } from "lucide-react";

interface AddCustomerModalProps {
  odpNodes: any[];
  availableDevices: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCustomerModal({
  odpNodes,
  availableDevices,
  onClose,
  onSuccess,
}: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    coordinates: "",
    mikhmonUsername: "",
    packageName: "10 Mbps Hemat",
    monthlyFee: "150000",
    installationFee: "200000",
    dueDay: "10",
    odpId: "",
    odpPort: "",
    signalDbm: "-19.0",
    notes: "",
    inventoryDeviceId: "",
    recordInstallationIncome: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await createHomeCustomer({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        coordinates: formData.coordinates || undefined,
        mikhmonUsername: formData.mikhmonUsername || undefined,
        packageName: formData.packageName,
        monthlyFee: Number(formData.monthlyFee),
        installationFee: Number(formData.installationFee || 0),
        dueDay: Number(formData.dueDay || 10),
        odpId: formData.odpId || undefined,
        odpPort: formData.odpPort ? Number(formData.odpPort) : undefined,
        signalDbm: formData.signalDbm ? Number(formData.signalDbm) : undefined,
        notes: formData.notes || undefined,
        inventoryDeviceId: formData.inventoryDeviceId || undefined,
        recordInstallationIncome: formData.recordInstallationIncome,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal mendaftarkan pelanggan baru");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Pasang Baru / Tambah Pelanggan</h3>
              <p className="text-xs text-slate-500">
                Pendaftaran langganan rumahan (PPPoE / Home WiFi)
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
          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Pelanggan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Bapak H. Rohman"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp / HP *
              </label>
              <input
                type="tel"
                required
                placeholder="081912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Pemasangan Rumah *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: RT 01 RW 01 Puyung Barat, dekat Pos Ronda"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          {/* Package & Fees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paket Layanan *
              </label>
              <input
                type="text"
                required
                placeholder="10 Mbps Hemat"
                value={formData.packageName}
                onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Iuran Bulanan (Rp) *
              </label>
              <input
                type="number"
                required
                placeholder="150000"
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#0B4EA2] focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tgl Jatuh Tempo (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="10"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          {/* Installation Fee & Auto Ledger Checkbox */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biaya Pasang Baru / Registrasi (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="200000"
                  value={formData.installationFee}
                  onChange={(e) => setFormData({ ...formData, installationFee: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username PPPoE Mikhmon (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="rohman_home"
                  value={formData.mikhmonUsername}
                  onChange={(e) => setFormData({ ...formData, mikhmonUsername: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white font-mono"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.recordInstallationIncome}
                onChange={(e) =>
                  setFormData({ ...formData, recordInstallationIncome: e.target.checked })
                }
                className="w-4 h-4 text-[#0B4EA2] rounded focus:ring-0"
              />
              <span>Catat Biaya Pasang Baru otomatis ke Buku Kas (Pemasukan)</span>
            </label>
          </div>

          {/* ODP & ONT Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titik ODP FTTH
              </label>
              <select
                value={formData.odpId}
                onChange={(e) => setFormData({ ...formData, odpId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
              >
                <option value="">-- Pilih ODP --</option>
                {odpNodes.map((odp) => (
                  <option key={odp.id} value={odp.id}>
                    {odp.code} (Sisa: {odp.freeCount ?? 0})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Port ODP (1-16)
              </label>
              <input
                type="number"
                min="1"
                max="16"
                placeholder="Contoh: 3"
                value={formData.odpPort}
                onChange={(e) => setFormData({ ...formData, odpPort: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Redaman Sinyal Awal (dBm)
              </label>
              <input
                type="text"
                placeholder="-19.2"
                value={formData.signalDbm}
                onChange={(e) => setFormData({ ...formData, signalDbm: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          {/* Device from Inventory */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pasang Perangkat
            </label>
            <select
              value={formData.inventoryDeviceId}
              onChange={(e) => setFormData({ ...formData, inventoryDeviceId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
            >
              <option value="">-- Tidak Memasang Perangkat / Bawa Sendiri --</option>
              {availableDevices.map((dev) => (
                <option key={dev.id} value={dev.id}>
                  [{dev.category}] {dev.brandModel} - SN: {dev.serialNumber} (Ready di Gudang)
                </option>
              ))}
            </select>
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
              {loading ? "Menyimpan..." : "Simpan & Buat Kartu Tagihan 12 Bulan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
