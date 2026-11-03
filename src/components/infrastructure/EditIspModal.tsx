"use client";

import { useState } from "react";
import { updateIspProvider } from "@/actions/infrastructure-actions";
import { X, Globe, AlertCircle } from "lucide-react";

interface EditIspModalProps {
  isp: any;
  routers: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditIspModal({
  isp,
  routers,
  onClose,
  onSuccess,
}: EditIspModalProps) {
  const [formData, setFormData] = useState({
    name: isp.name,
    bandwidthMbps: isp.bandwidthMbps ? isp.bandwidthMbps.toString() : "100",
    serviceType: isp.serviceType || "DEDICATED",
    circuitId: isp.circuitId || "",
    routerId: isp.routerId || "",
    monthlyCost: isp.monthlyCost ? isp.monthlyCost.toString() : "0",
    contactPhone: isp.contactPhone || "",
    status: isp.status || "ACTIVE",
    notes: isp.notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await updateIspProvider(isp.id, {
        name: formData.name,
        bandwidthMbps: Number(formData.bandwidthMbps || 100),
        serviceType: formData.serviceType,
        circuitId: formData.circuitId || null,
        routerId: formData.routerId || null,
        monthlyCost: Number(formData.monthlyCost || 0),
        contactPhone: formData.contactPhone || null,
        status: formData.status,
        notes: formData.notes || null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui data Provider ISP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Edit Provider ISP</h3>
              <p className="text-xs text-slate-500">{isp.name}</p>
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
              Nama Provider ISP *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kapasitas Bandwidth (Mbps) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.bandwidthMbps}
                onChange={(e) => setFormData({ ...formData, bandwidthMbps: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipe Layanan *
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
              >
                <option value="DEDICATED">Dedicated 1:1</option>
                <option value="BROADBAND">Broadband Business</option>
                <option value="WIRELESS">Wireless Point-to-Point Transit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Terhubung ke Router / POP
              </label>
              <select
                value={formData.routerId}
                onChange={(e) => setFormData({ ...formData, routerId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white font-medium"
              >
                <option value="">-- Tanpa Router Khusus --</option>
                {routers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.siteLocation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Link
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white font-semibold"
              >
                <option value="ACTIVE">ACTIVE (Aktif / Primary)</option>
                <option value="BACKUP">BACKUP (Failover)</option>
                <option value="ISOLATED">ISOLATED (Off / Maintenance)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Circuit ID / No. Pelanggan
              </label>
              <input
                type="text"
                value={formData.circuitId}
                onChange={(e) => setFormData({ ...formData, circuitId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biaya Langganan Bulanan (Rp)
              </label>
              <input
                type="number"
                value={formData.monthlyCost}
                onChange={(e) => setFormData({ ...formData, monthlyCost: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              No. Kontak Helpdesk ISP
            </label>
            <input
              type="text"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Konfigurasi / BGP (Opsional)
            </label>
            <textarea
              rows={2}
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
