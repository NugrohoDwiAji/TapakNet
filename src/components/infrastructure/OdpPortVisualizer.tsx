"use client";

import { Radio, Users, Wifi, CheckCircle2, AlertCircle, Signal, Eye, Edit2, Trash2 } from "lucide-react";

interface OdpPortVisualizerProps {
  odp: any;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export default function OdpPortVisualizer({
  odp,
  onView,
  onEdit,
  onDelete,
  isDeleting,
}: OdpPortVisualizerProps) {
  const capacity = odp.splitterCapacity || 8;
  const portMap = odp.portMap || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:border-blue-200 transition-all">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B4EA2] flex items-center justify-center font-bold text-xs">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#072255] font-mono">{odp.code}</h4>
              <p className="text-xs text-slate-500">
                {odp.olt ? `${odp.olt.name} (Port PON ${odp.ponPortNumber})` : "Direct / Standalone"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {odp.devices && odp.devices.length > 0 && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200"
              title={`SN Gudang: ${odp.devices[0].serialNumber}`}
            >
              SN: {odp.devices[0].serialNumber}
            </span>
          )}

          {odp.opticalPowerDbm !== null && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-medium flex items-center gap-1 border border-slate-200">
              <Signal className="w-3.5 h-3.5 text-blue-600" />
              {odp.opticalPowerDbm} dBm
            </span>
          )}

          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B4EA2] font-semibold border border-blue-200/60">
            {odp.occupiedCount} Terpakai / {odp.freeCount} Bebas
          </span>

          {/* Action Buttons: Lihat, Edit, Delete */}
          <div className="flex items-center gap-1.5 pl-1 sm:pl-2 sm:border-l border-slate-200">
            {onView && (
              <button
                onClick={onView}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#0B4EA2] hover:bg-blue-50 border border-slate-200 transition-colors shadow-2xs"
                title="Lihat Detail ODP"
              >
                <Eye className="w-3.5 h-3.5 text-[#0B4EA2]" />
                <span>Lihat</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors shadow-2xs"
                title="Edit Data ODP"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Edit</span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
                title="Hapus ODP"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {odp.notes && (
        <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          📍 <span className="font-semibold text-slate-700">Patokan Lokasi:</span> {odp.notes}
        </p>
      )}

      {/* Visual Port Occupancy Grid */}
      <div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Visualisasi Kapasitas Port Splitter (1 : {capacity}):
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {portMap.map((port: any) => {
            if (port.isOccupied) {
              const isCustomer = port.type === "CUSTOMER";
              return (
                <div
                  key={port.portNumber}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between text-xs transition-all shadow-2xs ${
                    isCustomer
                      ? "bg-blue-50/80 border-blue-200 text-[#072255]"
                      : "bg-amber-50/80 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-bold text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200">
                      P{port.portNumber}
                    </span>
                    {isCustomer ? (
                      <Users className="w-3.5 h-3.5 text-[#0B4EA2]" />
                    ) : (
                      <Wifi className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </div>

                  <div className="font-bold truncate text-[11px] mt-1" title={port.occupantName}>
                    {port.occupantName}
                  </div>

                  <div className="text-[9px] text-slate-500 mt-0.5 truncate">
                    {port.packageName || (isCustomer ? "Pelanggan" : "Hotspot")}
                  </div>

                  {port.signalDbm && (
                    <div className="text-[9px] font-mono font-semibold text-blue-700 mt-1">
                      {port.signalDbm} dBm
                    </div>
                  )}
                </div>
              );
            }

            // Free Port
            return (
              <div
                key={port.portNumber}
                className="p-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 text-emerald-800 flex flex-col justify-between text-xs hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-emerald-200">
                    P{port.portNumber}
                  </span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                </div>
                <div className="text-[10px] font-bold text-emerald-600 mt-2 text-center">
                  BEBAS
                </div>
                <div className="text-[8px] text-emerald-500/80 text-center">Ready Dropcore</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
