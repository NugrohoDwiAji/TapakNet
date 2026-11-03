"use client";

import { X, Network, Server, Globe, HardDrive, Copy, Check, Edit2, Trash2, MapPin } from "lucide-react";
import { formatDateTimeIndo } from "@/lib/utils";
import { useState } from "react";

interface RouterDetailModalProps {
  router: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RouterDetailModal({
  router,
  onClose,
  onEdit,
  onDelete,
}: RouterDetailModalProps) {
  const [copiedIp, setCopiedIp] = useState(false);

  const copyIp = () => {
    if (!router.ipAddress) return;
    navigator.clipboard.writeText(router.ipAddress);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-200/60">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Router Gateway / Titik POP
                </span>
                {router.isCoreGateway && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    CORE NOC
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#072255]">{router.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand & Specs */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Model Perangkat:
            </span>
            <span className="font-bold text-xs text-[#072255]">{router.brandModel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-[#0B4EA2]" />
            <span className="font-semibold">{router.siteLocation}</span>
          </div>
        </div>

        {/* Linked Inventory Device Unit */}
        {router.devices && router.devices.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" /> Unit Fisik dari Gudang
              </span>
              <span className="font-mono text-purple-900 font-bold">
                SN: {router.devices[0].serialNumber}
              </span>
            </div>
            <div className="text-slate-600 flex justify-between text-[11px] pt-1">
              <span>Model: {router.devices[0].brandModel}</span>
              {router.devices[0].macAddress && <span>MAC: {router.devices[0].macAddress}</span>}
            </div>
          </div>
        )}

        {/* Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">IP Address Gateway:</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-[#0B4EA2]">
                {router.ipAddress || "Tidak diset"}
              </span>
              {router.ipAddress && (
                <button
                  onClick={copyIp}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Salin IP"
                >
                  {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Port API RouterOS:</span>
            <span className="font-mono font-bold text-slate-800 block text-xs mt-0.5">
              {router.apiPort || 8728}
            </span>
          </div>
        </div>

        {/* Connected ISP Providers */}
        <div className="space-y-2">
          <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-600" />
            Upstream ISP Terhubung ({router.ispProviders?.length || 0}):
          </span>

          {router.ispProviders?.length === 0 ? (
            <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-200">
              Belum ada link ISP yang ditautkan ke router ini.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {router.ispProviders.map((isp: any) => (
                <div
                  key={isp.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-[#072255]">{isp.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {isp.bandwidthMbps} Mbps
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connected OLTs */}
        <div className="space-y-2">
          <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-[#0B4EA2]" />
            Master OLT Terhubung ({router.oltDevices?.length || 0}):
          </span>

          {router.oltDevices?.length === 0 ? (
            <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-200">
              Belum ada OLT yang ditautkan ke router ini.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {router.oltDevices.map((olt: any) => (
                <div
                  key={olt.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-[#072255]">{olt.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {olt.ponPortsCount} Port PON
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {router.notes && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium block mb-1">Catatan Routing / Interface:</span>
            <p className="text-slate-700 leading-relaxed font-mono text-[11px]">{router.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Ditambahkan: {formatDateTimeIndo(router.createdAt)}</span>
          <span>Diupdate: {formatDateTimeIndo(router.updatedAt)}</span>
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
              <span>Edit Router</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Router</span>
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
