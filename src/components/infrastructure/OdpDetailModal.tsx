"use client";

import { X, Radio, Signal, Copy, Check, Users, Wifi, Edit2, Trash2, MapPin, HardDrive } from "lucide-react";
import { formatDateTimeIndo } from "@/lib/utils";
import { useState } from "react";

interface OdpDetailModalProps {
  odp: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function OdpDetailModal({
  odp,
  onClose,
  onEdit,
  onDelete,
}: OdpDetailModalProps) {
  const [copiedCoord, setCopiedCoord] = useState(false);

  const copyCoordinates = () => {
    if (!odp.coordinates) return;
    navigator.clipboard.writeText(odp.coordinates);
    setCopiedCoord(true);
    setTimeout(() => setCopiedCoord(false), 2000);
  };

  const capacity = odp.splitterCapacity || 8;
  const portMap = odp.portMap || [];
  const occupiedList = portMap.filter((p: any) => p.isOccupied);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-200/60 font-bold font-mono">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Detail Tiang ODP FTTH
              </span>
              <h3 className="text-lg font-bold text-[#072255] font-mono">{odp.code}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Specs & Capacity */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Uplink Server OLT:
            </span>
            <span className="font-bold text-[#072255]">
              {odp.olt ? `${odp.olt.name} (Port PON ${odp.ponPortNumber})` : "Direct / Standalone"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {odp.opticalPowerDbm !== null && (
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono font-medium flex items-center gap-1">
                <Signal className="w-3.5 h-3.5 text-blue-600" />
                {odp.opticalPowerDbm} dBm
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B4EA2] font-bold border border-blue-200">
              {odp.occupiedCount} Terpakai / {odp.freeCount} Bebas
            </span>
          </div>
        </div>

        {/* Linked Inventory Device Unit */}
        {odp.devices && odp.devices.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" /> Unit Box ODP dari Gudang
              </span>
              <span className="font-mono text-indigo-900 font-bold">
                SN: {odp.devices[0].serialNumber}
              </span>
            </div>
            <div className="text-slate-600 flex justify-between text-[11px] pt-1">
              <span>Model: {odp.devices[0].brandModel}</span>
              {odp.devices[0].macAddress && <span>MAC: {odp.devices[0].macAddress}</span>}
            </div>
          </div>
        )}

        {/* GPS & Location Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Koordinat Tiang (GPS):</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-800">
                {odp.coordinates || "Tidak diset"}
              </span>
              {odp.coordinates && (
                <button
                  onClick={copyCoordinates}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Salin Koordinat"
                >
                  {copiedCoord ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Kapasitas Splitter:</span>
            <span className="font-bold text-[#072255] block mt-0.5">
              1 : {capacity} Port Splitter
            </span>
          </div>
        </div>

        {odp.notes && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium block mb-1">Patokan Lokasi Tiang:</span>
            <p className="text-slate-700 leading-relaxed">{odp.notes}</p>
          </div>
        )}

        {/* Occupied Ports List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              Daftar Port Terhubung ({occupiedList.length}):
            </span>
            <span className="text-[11px] text-slate-400">
              Sisa {odp.freeCount} port siap dropcore baru
            </span>
          </div>

          {occupiedList.length === 0 ? (
            <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-200">
              Belum ada pelanggan atau hotspot yang tertaut ke ODP ini (seluruh port bebas).
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {occupiedList.map((port: any) => (
                <div
                  key={port.portNumber}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-[#072255]">
                      Port {port.portNumber}
                    </span>
                    <span className="font-bold text-slate-800">{port.occupantName}</span>
                    <span className="text-[10px] text-slate-400">
                      ({port.type === "CUSTOMER" ? "Pelanggan" : "Hotspot"})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    {port.signalDbm && (
                      <span className="font-mono text-blue-700 font-semibold">
                        {port.signalDbm} dBm
                      </span>
                    )}
                    <span>{port.packageName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Ditambahkan: {formatDateTimeIndo(odp.createdAt)}</span>
          <span>Diupdate: {formatDateTimeIndo(odp.updatedAt)}</span>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-[#0B4EA2] hover:bg-blue-100 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit ODP</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ODP</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
