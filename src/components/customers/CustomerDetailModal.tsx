"use client";

import { useState } from "react";
import { formatRupiah, getMonthNameIndo, generateWhatsAppLink, formatDateIndo } from "@/lib/utils";
import {
  X,
  User,
  Phone,
  MapPin,
  Radio,
  Router,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Edit2,
  Trash2,
  MessageCircle,
  Zap,
} from "lucide-react";
import { InvoiceStatus } from "@prisma/client";

interface CustomerDetailModalProps {
  customer: any;
  selectedYear: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CustomerDetailModal({
  customer,
  selectedYear,
  onClose,
  onEdit,
  onDelete,
}: CustomerDetailModalProps) {
  const [copiedCoord, setCopiedCoord] = useState(false);

  const copyCoordinates = () => {
    if (!customer.coordinates) return;
    navigator.clipboard.writeText(customer.coordinates);
    setCopiedCoord(true);
    setTimeout(() => setCopiedCoord(false), 2000);
  };

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const shortMonths = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
  ];

  const invoiceMap = new Map();
  customer.invoices?.forEach((inv: any) => {
    if (inv.year === selectedYear) {
      invoiceMap.set(inv.month, inv);
    }
  });

  const paidCount = Array.from(invoiceMap.values()).filter(
    (inv: any) => inv.status === InvoiceStatus.PAID
  ).length;

  const waReminderMessage = `Halo Bapak/Ibu ${customer.name}, ini informasi layanan internet tapakNet Paket ${customer.packageName} (${formatRupiah(customer.monthlyFee)}/bln). Terima kasih 🙏`;
  const waReminderLink = generateWhatsAppLink(customer.phone, waReminderMessage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-200/60 font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#072255]">{customer.name}</h3>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                    customer.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : customer.status === "ISOLATED"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {customer.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Paket: <strong className="text-slate-800">{customer.packageName}</strong> • {formatRupiah(customer.monthlyFee)}/bln
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informasi Berlangganan & Teknis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Paket & Tagihan */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Data Layanan
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tarif Bulanan:</span>
              <strong className="text-[#0B4EA2] font-black text-sm">
                {formatRupiah(customer.monthlyFee)}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Jatuh Tempo:</span>
              <span className="font-semibold text-slate-700">Tanggal {customer.dueDay} / bln</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Biaya Pasang Baru:</span>
              <span className="font-semibold text-slate-700">
                {customer.installationFee ? formatRupiah(customer.installationFee) : "Gratis / Rp 0"}
              </span>
            </div>
            {customer.mikhmonUsername && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">User Mikhmon:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                  {customer.mikhmonUsername}
                </span>
              </div>
            )}
          </div>

          {/* FTTH ODP & Signal */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Jaringan & Redaman
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tiang / ODP:</span>
              <span className="font-semibold text-[#0B4EA2]">
                {customer.odp ? customer.odp.code : "Belum ditentukan"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Nomor Port ODP:</span>
              <span className="font-semibold text-slate-700">
                {customer.odpPort ? `Port ${customer.odpPort}` : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Redaman Optik (dBm):</span>
              <span
                className={`font-black ${
                  customer.signalDbm && customer.signalDbm < -24
                    ? "text-rose-600"
                    : "text-emerald-700"
                }`}
              >
                {customer.signalDbm ? `${customer.signalDbm} dBm` : "Belum diukur"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Perangkat:</span>
              <span className="font-semibold text-purple-700 truncate max-w-[140px]">
                {customer.devices && customer.devices.length > 0
                  ? `${customer.devices[0].brandModel} (SN: ${customer.devices[0].serialNumber})`
                  : "Belum tertaut"}
              </span>
            </div>
          </div>
        </div>

        {/* Kontak & Lokasi */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Kontak & Alamat
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-800">{customer.phone}</span>
            </div>
            <a
              href={waReminderLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat WhatsApp
            </a>
          </div>

          <div className="flex items-start gap-1.5 text-slate-600 pt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="text-slate-700">{customer.address}</span>
          </div>

          {customer.coordinates && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400 font-mono text-[11px]">
                GPS: {customer.coordinates}
              </span>
              <button
                type="button"
                onClick={copyCoordinates}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B4EA2] hover:underline"
              >
                {copiedCoord ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin GPS</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Ringkasan Tagihan 12 Bulan ({selectedYear}) */}
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#072255]">
              <Calendar className="w-4 h-4 text-[#0B4EA2]" />
              <span>Kartu Tagihan 12 Bulan ({selectedYear})</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500">
              Lunas: <span className="text-emerald-700 font-bold">{paidCount}</span> / 12 Bulan
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 text-center">
            {months.map((m, idx) => {
              const invoice = invoiceMap.get(m);
              const isPaid = invoice?.status === InvoiceStatus.PAID;
              return (
                <div
                  key={m}
                  className={`p-1.5 rounded-xl border text-[11px] font-bold ${
                    isPaid
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-2xs"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}
                  title={`${getMonthNameIndo(m)} ${selectedYear}: ${
                    isPaid ? "LUNAS (" + formatDateIndo(invoice?.paidAt) + ")" : "BELUM LUNAS"
                  }`}
                >
                  <div className="text-[10px]">{shortMonths[idx]}</div>
                  <div className="text-[9px] mt-0.5">{isPaid ? "✓" : "—"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Catatan Tambahan */}
        {customer.notes && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium block mb-1">Catatan Khusus:</span>
            <p className="text-slate-700 leading-relaxed">{customer.notes}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Pelanggan</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Pelanggan</span>
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
