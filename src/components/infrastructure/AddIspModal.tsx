"use client";

import { useState } from "react";
import { createIspProvider } from "@/actions/infrastructure-actions";
import { X, Globe, AlertCircle } from "lucide-react";

interface AddIspModalProps {
  routers: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddIspModal({
  routers,
  onClose,
  onSuccess,
}: AddIspModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    bandwidthMbps: "100",
    serviceType: "DEDICATED",
    circuitId: "",
    routerId: routers[0]?.id || "",
    monthlyCost: "3500000",
    contactPhone: "",
    status: "ACTIVE",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await createIspProvider({
        name: formData.name,
        bandwidthMbps: Number(formData.bandwidthMbps || 100),
        serviceType: formData.serviceType,
        circuitId: formData.circuitId || undefined,
        routerId: formData.routerId || undefined,
        monthlyCost: Number(formData.monthlyCost || 0),
        contactPhone: formData.contactPhone || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menambah data Provider ISP");
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
              <h3 className="text-lg font-bold text-[#072255]">Tambah Provider ISP</h3>
              <p className="text-xs text-slate-500">
                Penyedia bandwidth upstream / Internet Transit
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
              Nama Provider ISP *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Telkom Astinet Dedicated / Moratelindo BGP"
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
                placeholder="100"
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
                <option value="DEDICATED">Dedicated 1:1 (SLA Guaranteed)</option>
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
                Circuit ID / No. Pelanggan ISP
              </label>
              <input
                type="text"
                placeholder="Contoh: CID-AST-98214"
                value={formData.circuitId}
                onChange={(e) => setFormData({ ...formData, circuitId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biaya Langganan Bulanan (Rp)
              </label>
              <input
                type="number"
                placeholder="3500000"
                value={formData.monthlyCost}
                onChange={(e) => setFormData({ ...formData, monthlyCost: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Kontak Helpdesk / NOC ISP
              </label>
              <input
                type="text"
                placeholder="021-1234567 atau 08123456789"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Konfigurasi / BGP / IP Public (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: IP Public /29: 103.145.x.x, BGP ASN: 139xxx, Port SFP 1 Core MikroTik"
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
              {loading ? "Menyimpan..." : "Simpan ISP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
