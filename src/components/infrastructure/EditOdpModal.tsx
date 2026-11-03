"use client";

import { useState } from "react";
import { updateOdpNode } from "@/actions/infrastructure-actions";
import { X, Radio, AlertCircle } from "lucide-react";

interface EditOdpModalProps {
  odp: any;
  olts: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditOdpModal({
  odp,
  olts,
  onClose,
  onSuccess,
}: EditOdpModalProps) {
  const [formData, setFormData] = useState({
    code: odp.code,
    oltId: odp.oltId || "",
    ponPortNumber: odp.ponPortNumber ? odp.ponPortNumber.toString() : "1",
    splitterCapacity: odp.splitterCapacity ? odp.splitterCapacity.toString() : "8",
    coordinates: odp.coordinates || "",
    opticalPowerDbm: odp.opticalPowerDbm !== null && odp.opticalPowerDbm !== undefined ? odp.opticalPowerDbm.toString() : "",
    notes: odp.notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await updateOdpNode(odp.id, {
        code: formData.code.trim().toUpperCase(),
        oltId: formData.oltId || null,
        ponPortNumber: Number(formData.ponPortNumber || 1),
        splitterCapacity: Number(formData.splitterCapacity || 8),
        coordinates: formData.coordinates.trim() || undefined,
        opticalPowerDbm: formData.opticalPowerDbm !== "" ? Number(formData.opticalPowerDbm) : null,
        notes: formData.notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui data ODP");
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
              <h3 className="text-lg font-bold text-[#072255]">Edit Master ODP</h3>
              <p className="text-xs text-slate-500 font-mono">{odp.code}</p>
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
                Kode ODP *
              </label>
              <input
                type="text"
                required
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
                <option value="4">4 Port (Splitter 1:4)</option>
                <option value="8">8 Port (Splitter 1:8)</option>
                <option value="16">16 Port (Splitter 1:16)</option>
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
                max="16"
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
