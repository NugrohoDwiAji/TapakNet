"use client";

import { X, Server, Copy, Check, Radio, Signal, Edit2, Trash2, HardDrive } from "lucide-react";
import { formatDateTimeIndo } from "@/lib/utils";
import { useState } from "react";

interface OltDetailModalProps {
  olt: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function OltDetailModal({
  olt,
  onClose,
  onEdit,
  onDelete,
}: OltDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const copyIp = () => {
    if (!olt.localIp) return;
    navigator.clipboard.writeText(olt.localIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-200/60">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Master OLT (Optical Line Terminal)
              </span>
              <h3 className="text-lg font-bold text-[#072255]">{olt.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand & PON Capacity */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Merk & Seri Perangkat:
            </span>
            <span className="font-bold text-xs text-[#072255]">{olt.brandModel}</span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0B4EA2] border border-blue-200">
            {olt.ponPortsCount} Port PON
          </span>
        </div>

        {/* Linked Inventory Device Unit */}
        {olt.devices && olt.devices.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" /> Unit Inventaris Gudang
              </span>
              <span className="font-mono text-purple-900 font-bold">
                SN: {olt.devices[0].serialNumber}
              </span>
            </div>
            <div className="text-slate-600 flex justify-between text-[11px] pt-1">
              <span>Model: {olt.devices[0].brandModel}</span>
              {olt.devices[0].macAddress && <span>MAC: {olt.devices[0].macAddress}</span>}
            </div>
          </div>
        )}

        {/* Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">IP Manajemen Lokal:</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-[#0B4EA2]">
                {olt.localIp || "Tidak diset"}
              </span>
              {olt.localIp && (
                <button
                  onClick={copyIp}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Salin IP"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Lokasi Fisik Server:</span>
            <span className="font-semibold text-slate-800 block text-xs mt-0.5">
              {olt.location}
            </span>
          </div>
        </div>

        {/* Notes */}
        {olt.notes && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium block mb-1">Catatan Konfigurasi / Uplink:</span>
            <p className="text-slate-700 leading-relaxed font-mono text-[11px]">{olt.notes}</p>
          </div>
        )}

        {/* Connected ODP Nodes List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#0B4EA2]" />
              Tiang ODP Terhubung ({olt.odpNodes?.length || 0}):
            </span>
            <span className="text-[11px] text-slate-400">Distribusi Port PON</span>
          </div>

          {olt.odpNodes?.length === 0 ? (
            <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-200">
              Belum ada tiang ODP yang ditautkan ke OLT ini.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {olt.odpNodes.map((odp: any) => (
                <div
                  key={odp.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#072255]">{odp.code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-[#0B4EA2] font-semibold">
                      PON {odp.ponPortNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    {odp.opticalPowerDbm !== null && (
                      <span className="font-mono">{odp.opticalPowerDbm} dBm</span>
                    )}
                    <span>Kapasitas {odp.splitterCapacity} Port</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Ditambahkan: {formatDateTimeIndo(olt.createdAt)}</span>
          <span>Diupdate: {formatDateTimeIndo(olt.updatedAt)}</span>
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
              <span>Edit OLT</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus OLT</span>
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
