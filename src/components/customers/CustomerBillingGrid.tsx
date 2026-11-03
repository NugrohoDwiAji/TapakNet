"use client";

import { useState } from "react";
import { formatRupiah, getMonthNameIndo, generateWhatsAppLink, formatDateIndo } from "@/lib/utils";
import { unpayInvoice } from "@/actions/customer-actions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MessageCircle,
  Edit2,
  Radio,
  Router,
  RotateCcw,
  Receipt,
} from "lucide-react";
import { InvoiceStatus } from "@prisma/client";

interface CustomerBillingGridProps {
  customer: any;
  selectedYear: number;
  onPayInvoice: (invoice: any) => void;
  onEditCustomer: () => void;
  onRefresh: () => void;
}

export default function CustomerBillingGrid({
  customer,
  selectedYear,
  onPayInvoice,
  onEditCustomer,
  onRefresh,
}: CustomerBillingGridProps) {
  const [unpayingId, setUnpayingId] = useState<string | null>(null);

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const shortMonths = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Invoice map
  const invoiceMap = new Map();
  customer.invoices.forEach((inv: any) => {
    invoiceMap.set(inv.month, inv);
  });

  // Custom Confirm Card State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    action?: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const handleUnpay = (invoice: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Batalkan Status Lunas",
      description: `Batalkan status lunas tagihan bulan ${getMonthNameIndo(invoice.month)} ${selectedYear} (${formatRupiah(invoice.amount)}) untuk ${customer.name}? Transaksi pendapatan ini juga akan otomatis dihapus dari buku kas.`,
      confirmText: "Batalkan Lunas",
      action: async () => {
        try {
          setUnpayingId(invoice.id);
          await unpayInvoice(invoice.id);
          onRefresh();
        } finally {
          setUnpayingId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // WhatsApp reminder message for current month
  const currentInvoice = invoiceMap.get(currentMonth);
  const waReminderMessage = `Halo Bapak/Ibu ${customer.name}, ini pengingat tagihan internet tapakNet untuk bulan ${getMonthNameIndo(currentMonth)} ${selectedYear} sebesar ${formatRupiah(customer.monthlyFee)}. Jatuh tempo tanggal ${customer.dueDay}. Pembayaran bisa via transfer atau tunai ke teknisi. Terima kasih 🙏`;
  const waReminderLink = generateWhatsAppLink(customer.phone, waReminderMessage);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-200 transition-all p-5 sm:p-6 space-y-4">
      {/* Customer Info Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base sm:text-lg font-bold text-[#072255]">{customer.name}</h4>

            {/* Status Badge */}
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                customer.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : customer.status === "ISOLATED"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}
            >
              {customer.status}
            </span>

            {/* Mikhmon Username */}
            {customer.mikhmonUsername && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                User: {customer.mikhmonUsername}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
            <a
              href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-emerald-600 hover:underline font-semibold"
            >
              <Phone className="w-3 h-3" />
              {customer.phone}
            </a>
            <span>{customer.address}</span>
            {customer.odp && (
              <span className="flex items-center gap-1 text-[#0B4EA2] font-semibold">
                <Radio className="w-3 h-3" />
                {customer.odp.code} • Port {customer.odpPort ?? "-"}
                {customer.signalDbm && ` (${customer.signalDbm} dBm)`}
              </span>
            )}
            {customer.devices && customer.devices.length > 0 && (
              <span className="flex items-center gap-1 text-purple-700 font-medium">
                <Router className="w-3 h-3" />
                ONT: {customer.devices[0].brandModel} ({customer.devices[0].serialNumber})
              </span>
            )}
          </div>
        </div>

        {/* Pricing Info & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500">Tarif Bulanan:</div>
            <div className="text-base font-black text-[#0B4EA2]">
              {formatRupiah(customer.monthlyFee)}
              <span className="text-[10px] text-slate-400 font-normal"> / bln (tgl {customer.dueDay})</span>
            </div>
          </div>

          <a
            href={waReminderLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
            title="Kirim Pesan Pengingat Tagihan via WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim WA</span>
          </a>

          <button
            onClick={onEditCustomer}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            title="Edit Data Pelanggan"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 12-Month Billing Card Grid */}
      <div>
        <div className="flex items-center justify-between pb-2 text-xs">
          <span className="font-semibold text-slate-600">
            Kartu Tagihan 12 Bulan ({selectedYear}):
          </span>
          <span className="text-slate-400 text-[11px]">Klik bulan untuk bayar / batalkan</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {months.map((m, idx) => {
            const invoice = invoiceMap.get(m);
            const isPaid = invoice?.status === InvoiceStatus.PAID;
            const isCurrent = selectedYear === currentYear && m === currentMonth;
            const isPast =
              selectedYear < currentYear ||
              (selectedYear === currentYear && m < currentMonth);

            // WhatsApp receipt link for paid invoice
            const waReceiptText = `Terima kasih Bapak/Ibu ${customer.name}. Pembayaran tagihan internet tapakNet untuk bulan ${getMonthNameIndo(m)} ${selectedYear} sebesar ${formatRupiah(invoice?.amount || customer.monthlyFee)} telah LUNAS kami terima pada ${formatDateIndo(invoice?.paidAt)}. Salam, tapakNet 🙏`;
            const waReceiptLink = generateWhatsAppLink(customer.phone, waReceiptText);

            if (isPaid) {
              return (
                <div
                  key={m}
                  className="group relative p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col justify-between transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800">
                      {shortMonths[idx]}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 mt-1">LUNAS</div>
                  <div className="text-[9px] text-emerald-600/80 truncate">
                    {invoice.paidAt ? formatDateIndo(invoice.paidAt) : "Lunas"}
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="mt-1 pt-1 border-t border-emerald-200/60 flex items-center justify-center gap-2">
                    <a
                      href={waReceiptLink}
                      target="_blank"
                      rel="noreferrer"
                      title="Kirim Struk Lunas via WhatsApp"
                      className="text-emerald-700 hover:text-emerald-950"
                    >
                      <Receipt className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => handleUnpay(invoice)}
                      disabled={unpayingId === invoice.id}
                      title="Batalkan Lunas"
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            }

            // Unpaid / Pending
            return (
              <div
                key={m}
                onClick={() => invoice && onPayInvoice(invoice)}
                className={`cursor-pointer p-2.5 rounded-xl border text-center flex flex-col justify-between transition-all hover:scale-[1.03] ${
                  isCurrent
                    ? "bg-amber-50/80 border-amber-300 shadow-sm hover:bg-amber-100"
                    : isPast
                    ? "bg-rose-50/60 border-rose-200 hover:bg-rose-100"
                    : "bg-slate-50/60 border-slate-200 hover:bg-blue-50 hover:border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">
                    {shortMonths[idx]}
                  </span>
                  {isCurrent ? (
                    <Clock className="w-3 h-3 text-amber-500" />
                  ) : isPast ? (
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                  ) : null}
                </div>
                <div
                  className={`text-[10px] font-bold mt-1 ${
                    isCurrent
                      ? "text-amber-700"
                      : isPast
                      ? "text-rose-600"
                      : "text-slate-400"
                  }`}
                >
                  {isCurrent ? "BELUM" : isPast ? "TUNGGAKAN" : "PENDING"}
                </div>
                <div className="text-[9px] text-[#0B4EA2] font-semibold mt-0.5">
                  Bayar &rarr;
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Confirmation Modal Card */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant="warning"
        isLoading={Boolean(unpayingId)}
        onConfirm={() => confirmDialog.action && confirmDialog.action()}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
