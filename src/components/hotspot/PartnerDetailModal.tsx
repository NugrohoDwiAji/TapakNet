"use client";

import {
  X,
  Store,
  Phone,
  MapPin,
  Radio,
  Wifi,
  Copy,
  Check,
  PackagePlus,
  Calculator,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import { formatRupiah, formatDateTimeIndo, generateWhatsAppLink } from "@/lib/utils";
import { useState } from "react";

interface PartnerDetailModalProps {
  partner: any;
  packages: any[];
  onClose: () => void;
  onDropStock: () => void;
  onSettlement: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PartnerDetailModal({
  partner,
  packages,
  onClose,
  onDropStock,
  onSettlement,
  onEdit,
  onDelete,
}: PartnerDetailModalProps) {
  const [copiedCoord, setCopiedCoord] = useState(false);

  const copyCoordinates = () => {
    if (!partner.coordinates) return;
    navigator.clipboard.writeText(partner.coordinates);
    setCopiedCoord(true);
    setTimeout(() => setCopiedCoord(false), 2000);
  };

  const totalStock = partner.stocks.reduce(
    (acc: number, s: any) => acc + s.quantity,
    0
  );

  // WhatsApp Link
  const waLink = generateWhatsAppLink(
    partner.phone,
    `Halo ${partner.ownerName} (${partner.name}), dari Tim tapakNet.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-200/60">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Detail Mitra Titik Hotspot
              </span>
              <h3 className="text-lg font-bold text-[#072255]">{partner.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Balance Card */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Pemilik / Penanggung Jawab:
            </span>
            <span className="font-bold text-sm text-[#072255]">{partner.ownerName}</span>
          </div>

          <div>
            {partner.unpaidBalance > 0 ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Piutang: {formatRupiah(partner.unpaidBalance)}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Setoran Bersih (Rp 0)
              </span>
            )}
          </div>
        </div>

        {/* Contact & Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Nomor WhatsApp / HP:</span>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="text-[#0B4EA2] hover:underline font-bold flex items-center gap-1 mt-0.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{partner.phone}</span>
            </a>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">Koordinat Lokasi (GPS):</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-800">
                {partner.coordinates || "Tidak diset"}
              </span>
              {partner.coordinates && (
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
        </div>

        {/* Address & ODP */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs text-xs space-y-2">
          <div>
            <span className="text-slate-400 font-medium block mb-0.5">Alamat Lengkap:</span>
            <div className="flex items-start gap-1.5 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{partner.address}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#0B4EA2]" />
              <span className="text-slate-500">Tiang ODP:</span>
              <strong className="text-slate-800 font-mono">
                {partner.odp ? `${partner.odp.code} (Port ${partner.odpPort ?? "-"})` : "Belum Ditentukan"}
              </strong>
            </div>

            {partner.devices && partner.devices.length > 0 && (
              <div className="flex items-center gap-1.5 text-purple-700">
                <HardDrive className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">
                  {partner.devices[0].brandModel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stock Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-[#0B4EA2]" />
              Stok Voucher Fisik di Warung:
            </span>
            <span className="font-bold text-[#0B4EA2]">Total: {totalStock} pcs</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {packages.map((pkg) => {
              const stock =
                partner.stocks.find((s: any) => s.packageId === pkg.id)?.quantity || 0;
              return (
                <div
                  key={pkg.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center"
                >
                  <span className="text-[11px] text-slate-500 block truncate">{pkg.name}</span>
                  <span className="text-base font-black text-[#072255] block mt-0.5">
                    {stock} pcs
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Jual: {formatRupiah(pkg.sellPrice)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        {partner.notes && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium block mb-1">Catatan Warung / Titik:</span>
            <p className="text-slate-700 leading-relaxed">{partner.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Terdaftar: {formatDateTimeIndo(partner.createdAt)}</span>
          <span>Diupdate: {formatDateTimeIndo(partner.updatedAt)}</span>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                onClose();
                onDropStock();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-[#0B4EA2] hover:bg-blue-100 transition-colors"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Drop Stok</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onSettlement();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0B4EA2] text-white hover:bg-blue-800 transition-colors shadow-sm"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Tarik Setoran</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 ml-auto"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
