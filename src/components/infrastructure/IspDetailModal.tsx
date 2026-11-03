"use client";

import { X, Globe, Network, DollarSign, Phone, Copy, Check, Edit2, Trash2 } from "lucide-react";
import { formatDateTimeIndo, formatRupiah } from "@/lib/utils";
import { useState } from "react";

interface IspDetailModalProps {
  isp: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function IspDetailModal({
  isp,
  onClose,
  onEdit,
  onDelete,
}: IspDetailModalProps) {
  const [copiedCid, setCopiedCid] = useState(false);

  const copyCid = () => {
    if (!isp.circuitId) return;
    navigator.clipboard.writeText(isp.circuitId);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Provider ISP Upstream
              </span>
              <h3 className="text-lg font-bold text-[#072255]">{isp.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bandwidth & Service Type */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Kapasitas Bandwidth:
            </span>
            <span className="font-bold text-base text-emerald-700">{isp.bandwidthMbps} Mbps</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0B4EA2] border border-blue-200">
              {isp.serviceType}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isp.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isp.status === "BACKUP"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {isp.status}
            </span>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Router Gateway Tujuan:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Network className="w-4 h-4 text-[#0B4EA2]" />
              <span className="font-bold text-slate-800">
                {isp.router ? `${isp.router.name} (${isp.router.siteLocation})` : "Standalone / Belum Ditautkan"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Biaya Langganan Bulanan:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-sm text-slate-900">
                {isp.monthlyCost ? formatRupiah(isp.monthlyCost) : "Gratis / Peering"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Circuit ID / No. Pelanggan:</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-800">
                {isp.circuitId || "-"}
              </span>
              {isp.circuitId && (
                <button
                  onClick={copyCid}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Salin CID"
                >
                  {copiedCid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Kontak Helpdesk ISP:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono font-bold text-slate-800">
                {isp.contactPhone || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {isp.notes && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium block mb-1">Catatan Konfigurasi / BGP / IP:</span>
            <p className="text-slate-700 leading-relaxed font-mono text-[11px]">{isp.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Ditambahkan: {formatDateTimeIndo(isp.createdAt)}</span>
          <span>Diupdate: {formatDateTimeIndo(isp.updatedAt)}</span>
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
              <span>Edit ISP</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ISP</span>
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
