"use client";

import { X, HardDrive, Calendar, DollarSign, Users, Wifi, Clock, Copy, Check, Info, Server, Radio, Network } from "lucide-react";
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from "@/lib/utils";
import { useState } from "react";
import { DeviceStatus } from "@prisma/client";

interface DeviceDetailModalProps {
  device: any;
  onClose: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export default function DeviceDetailModal({
  device,
  onClose,
  onEdit,
  onToggleActive,
  onDelete,
}: DeviceDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const copySn = () => {
    navigator.clipboard.writeText(device.serialNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.IN_STOCK:
        return { label: "IN_STOCK (Ready di Gudang)", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case DeviceStatus.DEPLOYED_INFRA:
        return { label: "DEPLOYED_INFRA (Terpasang di OLT/ODP)", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case DeviceStatus.DEPLOYED_HOME:
        return { label: "DEPLOYED_HOME (Terpasang di Pelanggan)", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case DeviceStatus.DEPLOYED_HOTSPOT:
        return { label: "DEPLOYED_HOTSPOT (Terpasang di Warung)", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case DeviceStatus.BROKEN:
        return { label: "BROKEN (Rusak / Afkir)", color: "bg-rose-50 text-rose-700 border-rose-200" };
      case DeviceStatus.INACTIVE:
        return { label: "INACTIVE (Non Aktif)", color: "bg-slate-100 text-slate-700 border-slate-300" };
      default:
        return { label: status, color: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const statusBadge = getStatusBadge(device.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Detail Inventaris Perangkat
              </span>
              <h3 className="text-lg font-bold text-[#072255]">{device.brandModel}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Category */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Kategori:</span>
            <span className="font-bold text-xs text-[#072255]">
              {device.category === "OTHER" && device.customCategory
                ? device.customCategory
                : device.category}
            </span>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-bold border ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Specs & Identifiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Serial Number (SN):</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-[#0B4EA2]">{device.serialNumber}</span>
              <button
                onClick={copySn}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                title="Salin SN"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">MAC Address:</span>
            <span className="font-mono font-semibold text-slate-700 block mt-0.5">
              {device.macAddress || "-"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Tanggal Pembelian:</span>
            <span className="font-semibold text-slate-700 block mt-0.5">
              {device.purchaseDate ? formatDateIndo(device.purchaseDate) : "-"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Harga Beli / Nilai Aset:</span>
            <span className="font-bold text-slate-900 block mt-0.5">
              {device.purchasePrice ? formatRupiah(device.purchasePrice) : "-"}
            </span>
          </div>
        </div>

        {/* Deployment Info */}
        <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs space-y-1.5">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">
            Penempatan Perangkat:
          </span>
          {device.homeCustomer ? (
            <div className="flex items-center gap-2 text-slate-800">
              <Users className="w-4 h-4 text-[#0B4EA2]" />
              <span>
                Terpasang di Pelanggan Rumahan: <strong>{device.homeCustomer.name}</strong> ({device.homeCustomer.phone})
              </span>
            </div>
          ) : device.hotspotPartner ? (
            <div className="flex items-center gap-2 text-slate-800">
              <Wifi className="w-4 h-4 text-amber-600" />
              <span>
                Terpasang di Titik Hotspot / Warung: <strong>{device.hotspotPartner.name}</strong> ({device.hotspotPartner.phone})
              </span>
            </div>
          ) : device.routerDevice ? (
            <div className="flex items-center gap-2 text-slate-800">
              <Network className="w-4 h-4 text-[#0B4EA2]" />
              <span>
                Terpasang di Router / POP: <strong>{device.routerDevice.name}</strong> (Lokasi: {device.routerDevice.siteLocation})
              </span>
            </div>
          ) : device.oltDevice ? (
            <div className="flex items-center gap-2 text-slate-800">
              <Server className="w-4 h-4 text-purple-600" />
              <span>
                Terpasang di Master OLT: <strong>{device.oltDevice.name}</strong> (Lokasi: {device.oltDevice.location})
              </span>
            </div>
          ) : device.odpNode ? (
            <div className="flex items-center gap-2 text-slate-800">
              <Radio className="w-4 h-4 text-indigo-600" />
              <span>
                Terpasang di Box ODP: <strong>{device.odpNode.code}</strong> (Port PON {device.odpNode.ponPortNumber})
              </span>
            </div>
          ) : (
            <span className="text-emerald-700 font-semibold block">
              Tersedia di Gudang (Belum dialokasikan ke pelanggan / infrastruktur)
            </span>
          )}
        </div>

        {/* Notes */}
        {device.notes && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium block mb-1">Catatan / Posisi Rak:</span>
            <p className="text-slate-700 leading-relaxed">{device.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Ditambahkan: {formatDateTimeIndo(device.createdAt)}</span>
          <span>Diupdate: {formatDateTimeIndo(device.updatedAt)}</span>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-[#0B4EA2] hover:bg-blue-100 transition-colors"
            >
              Edit Perangkat
            </button>
            <button
              onClick={() => {
                onClose();
                onToggleActive();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                device.status === DeviceStatus.INACTIVE
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {device.status === DeviceStatus.INACTIVE ? "Aktifkan Kembali" : "Non Aktifkan"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Hapus
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
