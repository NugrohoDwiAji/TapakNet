"use client";

import { useState } from "react";
import { updateOdpNode } from "@/actions/infrastructure-actions";
import { X, Radio, AlertCircle, Server, Globe } from "lucide-react";

interface EditOdpModalProps {
  odp: any;
  olts: any[];
  odps?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditOdpModal({
  odp,
  olts,
  odps = [],
  onClose,
  onSuccess,
}: EditOdpModalProps) {
  const initialUplink = odp.parentOdpId
    ? "ODP"
    : odp.oltId
    ? "OLT"
    : "DIRECT";

  const [uplinkType, setUplinkType] = useState<"OLT" | "ODP" | "DIRECT">(initialUplink);

  const [formData, setFormData] = useState({
    code: odp.code,
    oltId: odp.oltId || "",
    ponPortNumber: odp.ponPortNumber ? odp.ponPortNumber.toString() : "1",
    parentOdpId: odp.parentOdpId || "",
    parentOdpPort: odp.parentOdpPort ? odp.parentOdpPort.toString() : "1",
    splitterCapacity: odp.splitterCapacity ? odp.splitterCapacity.toString() : "8",
    coordinates: odp.coordinates || "",
    opticalPowerDbm:
      odp.opticalPowerDbm !== null && odp.opticalPowerDbm !== undefined
        ? odp.opticalPowerDbm.toString()
        : "",
    notes: odp.notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out this ODP itself and any child ODP to prevent cycles
  const availableParentOdps = odps.filter(
    (o) => o.id !== odp.id && o.parentOdpId !== odp.id
  );

  const selectedParentOdp = odps.find((o) => o.id === formData.parentOdpId);

  const handleParentOdpChange = (newParentId: string) => {
    const parent = odps.find((o) => o.id === newParentId);
    const firstFreePort = parent?.portMap?.find((pm: any) => !pm.isOccupied)?.portNumber || 1;
    setFormData((prev) => ({
      ...prev,
      parentOdpId: newParentId,
      parentOdpPort: firstFreePort.toString(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      let oltId: string | null = null;
      let ponPortNumber: number = 1;
      let parentOdpId: string | null = null;
      let parentOdpPort: number | null = null;

      if (uplinkType === "OLT") {
        oltId = formData.oltId || null;
        ponPortNumber = Number(formData.ponPortNumber) || 1;
        parentOdpId = null;
        parentOdpPort = null;
      } else if (uplinkType === "ODP") {
        if (!formData.parentOdpId) {
          throw new Error("Silakan pilih ODP / Splitter Induk");
        }
        parentOdpId = formData.parentOdpId;
        parentOdpPort = Number(formData.parentOdpPort) || 1;
        const parent = odps.find((o) => o.id === formData.parentOdpId);
        oltId = parent?.oltId || null;
        ponPortNumber = parent?.ponPortNumber || 1;
      } else {
        oltId = null;
        ponPortNumber = 1;
        parentOdpId = null;
        parentOdpPort = null;
      }

      await updateOdpNode(odp.id, {
        code: formData.code.trim().toUpperCase(),
        oltId,
        ponPortNumber,
        parentOdpId,
        parentOdpPort,
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

          {/* UPLINK CONNECTION SELECTOR */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#072255] mb-1">
                Pilihan Koneksi Uplink (Terhubung Ke) *
              </label>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Tentukan apakah ODP ini terhubung langsung ke Server OLT atau mencabang dari ODP/Splitter lain
              </p>

              {/* Uplink Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUplinkType("OLT")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                    uplinkType === "OLT"
                      ? "bg-white text-[#0B4EA2] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Ke OLT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUplinkType("ODP")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                    uplinkType === "ODP"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Ke ODP Lain</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUplinkType("DIRECT")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                    uplinkType === "DIRECT"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Direct / Solo</span>
                </button>
              </div>
            </div>

            {/* Sub-form: Terhubung ke OLT */}
            {uplinkType === "OLT" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Server OLT
                  </label>
                  <select
                    value={formData.oltId}
                    onChange={(e) => setFormData({ ...formData, oltId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white font-medium"
                  >
                    <option value="">-- Tanpa OLT --</option>
                    {olts.map((olt) => (
                      <option key={olt.id} value={olt.id}>
                        {olt.name} ({olt.ponPortsCount} Port PON)
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
                  />
                </div>
              </div>
            )}

            {/* Sub-form: Terhubung ke ODP / Splitter Lain */}
            {uplinkType === "ODP" && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilih ODP / Splitter Induk *
                    </label>
                    <select
                      value={formData.parentOdpId}
                      onChange={(e) => handleParentOdpChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white font-medium text-slate-800"
                    >
                      <option value="">-- Pilih ODP / Splitter Lain --</option>
                      {availableParentOdps.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.code} (1:{o.splitterCapacity} • Sisa {o.freeCount ?? "?"} port)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Port Splitter ODP Induk
                    </label>
                    <select
                      value={formData.parentOdpPort}
                      onChange={(e) => setFormData({ ...formData, parentOdpPort: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white font-medium text-slate-800"
                    >
                      {Array.from({ length: selectedParentOdp?.splitterCapacity || 8 }).map(
                        (_, idx) => {
                          const portNum = idx + 1;
                          const portInfo = selectedParentOdp?.portMap?.find(
                            (pm: any) => pm.portNumber === portNum
                          );
                          const isOccupied =
                            portInfo?.isOccupied &&
                            !(portInfo.type === "ODP" && portInfo.occupantId === odp.id);
                          return (
                            <option key={portNum} value={portNum}>
                              Port {portNum}{" "}
                              {isOccupied
                                ? `(Terisi: ${portInfo.occupantName})`
                                : "(Bebas / Tersedia)"}
                            </option>
                          );
                        }
                      )}
                    </select>
                  </div>
                </div>

                {selectedParentOdp && (
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Induk Terpilih: <strong>{selectedParentOdp.code}</strong></span>
                      </span>
                      <span className="font-mono text-[11px] text-indigo-700 font-bold">
                        1:{selectedParentOdp.splitterCapacity} ({selectedParentOdp.freeCount} Port Bebas)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {selectedParentOdp.olt
                        ? `Jalur OLT: ${selectedParentOdp.olt.name} (Port PON ${selectedParentOdp.ponPortNumber})`
                        : "Status Induk: Standalone"}
                      {selectedParentOdp.notes ? ` • Lokasi: ${selectedParentOdp.notes}` : ""}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Sub-form: Standalone */}
            {uplinkType === "DIRECT" && (
              <p className="text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                ODP ini berstatus direct / standalone tanpa upstream langsung dari OLT maupun ODP lain.
              </p>
            )}
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
