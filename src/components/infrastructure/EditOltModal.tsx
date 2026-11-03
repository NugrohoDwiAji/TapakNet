"use client";

import { useState } from "react";
import { updateOltDevice } from "@/actions/infrastructure-actions";
import { X, Server, AlertCircle } from "lucide-react";

interface EditOltModalProps {
  olt: any;
  routers?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditOltModal({
  olt,
  routers = [],
  onClose,
  onSuccess,
}: EditOltModalProps) {
  const [formData, setFormData] = useState({
    name: olt.name,
    brandModel: olt.brandModel,
    localIp: olt.localIp || "",
    ponPortsCount: olt.ponPortsCount ? olt.ponPortsCount.toString() : "4",
    location: olt.location,
    routerId: olt.routerId || "",
    notes: olt.notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await updateOltDevice(olt.id, {
        name: formData.name,
        brandModel: formData.brandModel,
        localIp: formData.localIp.trim() || undefined,
        ponPortsCount: Number(formData.ponPortsCount),
        location: formData.location,
        routerId: formData.routerId || null,
        notes: formData.notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui data OLT");
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
              <h3 className="text-lg font-bold text-[#072255]">Edit Master OLT</h3>
              <p className="text-xs text-slate-500">{olt.name}</p>
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
              Nama OLT *
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
                Merk & Model *
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
              Catatan Konfigurasi / Uplink
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
