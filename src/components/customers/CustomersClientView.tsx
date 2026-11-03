"use client";

import React, { useState, Fragment } from "react";
import {
  formatRupiah,
  getMonthNameIndo,
  formatDateIndo,
  generateWhatsAppLink,
} from "@/lib/utils";
import {
  deleteHomeCustomer,
  unpayInvoice,
  toggleHomeCustomerStatus,
} from "@/actions/customer-actions";
import PayInvoiceModal from "./PayInvoiceModal";
import AddCustomerModal from "./AddCustomerModal";
import EditCustomerModal from "./EditCustomerModal";
import CustomerDetailModal from "./CustomerDetailModal";
import ConfirmDialog, { ConfirmVariant } from "@/components/ui/ConfirmDialog";
import {
  Users,
  UserPlus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Radio,
  Router,
  MessageCircle,
  Receipt,
  RotateCcw,
  Check,
  AlertCircle,
} from "lucide-react";
import { CustomerStatus, InvoiceStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

interface CustomersClientViewProps {
  customers: any[];
  odpNodes: any[];
  availableDevices: any[];
  initialYear: number;
}

export default function CustomersClientView({
  customers,
  odpNodes,
  availableDevices,
  initialYear,
}: CustomersClientViewProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Expanded rows state for 12-month billing matrix
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Set<string>>(
    new Set()
  );

  // Modal states
  const [payingInvoice, setPayingInvoice] = useState<{
    customer: any;
    invoice: any;
  } | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Custom Confirm Card Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: ConfirmVariant;
    action?: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const toggleExpand = (id: string) => {
    setExpandedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      (c.mikhmonUsername &&
        c.mikhmonUsername.toLowerCase().includes(search.toLowerCase())) ||
      (c.odp?.code && c.odp.code.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Monthly Recurring Revenue (MRR)
  const totalActiveMRR = customers
    .filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + c.monthlyFee, 0);

  // Current month stats
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentRealYear = now.getFullYear();

  let paidCountThisMonth = 0;
  let unpaidCountThisMonth = 0;

  customers.forEach((c) => {
    const inv = c.invoices?.find(
      (i: any) => i.year === selectedYear && i.month === currentMonth
    );
    if (inv?.status === InvoiceStatus.PAID) {
      paidCountThisMonth++;
    } else {
      unpaidCountThisMonth++;
    }
  });

  // Action: Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (customerId: string) => {
    try {
      setTogglingId(customerId);
      await toggleHomeCustomerStatus(customerId);
      handleRefresh();
    } catch (err: any) {
      console.error("Gagal mengubah status pelanggan:", err);
    } finally {
      setTogglingId(null);
    }
  };

  // Action: Delete Customer
  const handleDeleteCustomer = (customer: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Pelanggan Rumahan",
      description: `Apakah Anda yakin ingin menghapus pelanggan "${customer.name}"? Semua perangkat ONT/Router yang terpasang akan otomatis dikembalikan ke stok gudang (IN_STOCK), dan seluruh riwayat tagihan akan dihapus permanen.`,
      confirmText: "Ya, Hapus Pelanggan",
      variant: "danger",
      action: async () => {
        await deleteHomeCustomer(customer.id);
        handleRefresh();
      },
    });
  };

  // Action: Unpay Invoice
  const handleUnpayInvoice = (customer: any, invoice: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Batalkan Status Lunas",
      description: `Batalkan status lunas tagihan bulan ${getMonthNameIndo(
        invoice.month
      )} ${selectedYear} (${formatRupiah(invoice.amount)}) untuk ${
        customer.name
      }? Transaksi pendapatan ini juga akan otomatis dihapus dari buku kas keuangan.`,
      confirmText: "Batalkan Lunas",
      variant: "warning",
      action: async () => {
        await unpayInvoice(invoice.id);
        handleRefresh();
      },
    });
  };

  const handleExecuteConfirm = async () => {
    if (!confirmDialog.action) return;
    try {
      setConfirmLoading(true);
      await confirmDialog.action();
    } catch (err: any) {
      console.error("Konfirmasi error:", err);
    } finally {
      setConfirmLoading(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const shortMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ags",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pelanggan Aktif
            </div>
            <div className="text-xl font-black text-[#072255]">
              {customers.filter((c) => c.status === "ACTIVE").length} Rumah
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estimasi Pemasukan Bulanan (MRR)
            </div>
            <div className="text-xl font-black text-emerald-700">
              {formatRupiah(totalActiveMRR)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status Tagihan Bulan Ini ({getMonthNameIndo(currentMonth)})
            </div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-0.5">
              <span className="text-emerald-600">{paidCountThisMonth} Lunas</span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-600">{unpaidCountThisMonth} Belum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, user mikhmon, no hp, alamat, ODP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-slate-50/50"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">ACTIVE (Aktif)</option>
            <option value="ISOLATED">ISOLATED (Isolir)</option>
            <option value="INACTIVE">INACTIVE (Nonaktif)</option>
          </select>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-[#0B4EA2]" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={2025}>Tahun 2025</option>
              <option value={2026}>Tahun 2026</option>
              <option value={2027}>Tahun 2027</option>
            </select>
          </div>

          {/* Add Customer Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Pasang Baru</span>
          </button>
        </div>
      </div>

      {/* Customer Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-3 text-center w-12">#</th>
                <th className="py-3.5 px-4">Pelanggan & Kontak</th>
                <th className="py-3.5 px-4">Paket & Tarif</th>
                <th className="py-3.5 px-4">ODP & Perangkat</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">
                  Tagihan ({getMonthNameIndo(currentMonth)})
                </th>
                <th className="py-3.5 px-4 text-center w-56">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">
                      Tidak ada pelanggan yang cocok dengan kriteria pencarian.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => {
                  const isExpanded = expandedCustomerIds.has(customer.id);

                  // Map invoices for the selected year
                  const invoiceMap = new Map();
                  customer.invoices?.forEach((inv: any) => {
                    if (inv.year === selectedYear) {
                      invoiceMap.set(inv.month, inv);
                    }
                  });

                  // Current month invoice
                  const currentMonthInvoice = invoiceMap.get(currentMonth);
                  const isPaidThisMonth =
                    currentMonthInvoice?.status === InvoiceStatus.PAID;

                  // Paid count in selected year
                  const paidCountYear = Array.from(invoiceMap.values()).filter(
                    (inv: any) => inv.status === InvoiceStatus.PAID
                  ).length;

                  // WhatsApp reminder message
                  const waMessage = `Halo Bapak/Ibu ${customer.name}, ini informasi tagihan internet tapakNet Paket ${customer.packageName} (${formatRupiah(customer.monthlyFee)}/bln). Jatuh tempo tanggal ${customer.dueDay}. Terima kasih 🙏`;
                  const waLink = generateWhatsAppLink(customer.phone, waMessage);

                  return (
                    <React.Fragment key={customer.id}>
                      <tr className="hover:bg-blue-50/40 transition-colors group">
                        {/* No */}
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-400">
                          {index + 1}
                        </td>

                        {/* Pelanggan & Kontak */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSelectedCustomerForDetail(customer)}
                                className="font-bold text-[#072255] text-sm hover:text-[#0B4EA2] hover:underline text-left cursor-pointer"
                              >
                                {customer.name}
                              </button>
                              {customer.mikhmonUsername && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                  {customer.mikhmonUsername}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 text-xs mt-0.5 flex-wrap">
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                                title="Kirim Pesan WhatsApp"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{customer.phone}</span>
                              </a>
                              <span className="text-slate-300">•</span>
                              <span
                                className="text-slate-500 truncate max-w-[200px] flex items-center gap-1"
                                title={customer.address}
                              >
                                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{customer.address}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Paket & Tarif */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">
                            {customer.packageName}
                          </div>
                          <div className="font-black text-[#0B4EA2] text-xs">
                            {formatRupiah(customer.monthlyFee)}
                            <span className="text-[10px] text-slate-400 font-normal">
                              {" "}
                              / bln
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Jatuh tempo: tgl {customer.dueDay}
                          </div>
                        </td>

                        {/* ODP & Perangkat */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-[#0B4EA2] font-semibold text-xs">
                              <Radio className="w-3.5 h-3.5" />
                              <span>
                                {customer.odp ? customer.odp.code : "Belum ODP"}
                                {customer.odpPort ? ` (Port ${customer.odpPort})` : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {customer.signalDbm ? (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    customer.signalDbm < -24
                                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  {customer.signalDbm} dBm
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  -
                                </span>
                              )}
                              {customer.devices && customer.devices.length > 0 && (
                                <span
                                  className="text-[10px] text-purple-700 font-medium flex items-center gap-1 truncate max-w-[130px]"
                                  title={`${customer.devices[0].brandModel} (SN: ${customer.devices[0].serialNumber})`}
                                >
                                  <Router className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {customer.devices[0].brandModel}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status Layanan */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                              customer.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : customer.status === "ISOLATED"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                customer.status === "ACTIVE"
                                  ? "bg-emerald-500"
                                  : customer.status === "ISOLATED"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {customer.status}
                          </span>
                        </td>

                        {/* Tagihan Bulan Ini */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPaidThisMonth ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Lunas</span>
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {currentMonthInvoice?.paidAt
                                  ? formatDateIndo(currentMonthInvoice.paidAt)
                                  : "Tercatat lunas"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <Clock className="w-3 h-3 text-rose-600" />
                                <span>Belum Lunas</span>
                              </span>
                              {currentMonthInvoice && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPayingInvoice({
                                      customer,
                                      invoice: currentMonthInvoice,
                                    })
                                  }
                                  className="text-[10px] px-2 py-0.5 rounded-lg bg-[#0B4EA2] hover:bg-blue-800 text-white font-semibold transition-colors shadow-2xs"
                                >
                                  Bayar
                                </button>
                              )}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1">
                            Tahun {selectedYear}:{" "}
                            <strong className="text-slate-600">
                              {paidCountYear}
                            </strong>
                            /12 bln
                          </div>
                        </td>

                        {/* Action Buttons: Toggle Status, Lihat, Edit, Delet, & Expand */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* Toggle Status Aktif / Nonaktif */}
                            <div
                              className="flex items-center"
                              title={
                                customer.status === "ACTIVE"
                                  ? "Status: AKTIF (Klik untuk nonaktifkan)"
                                  : "Status: NONAKTIF (Klik untuk aktifkan)"
                              }
                            >
                              <button
                                type="button"
                                role="switch"
                                aria-checked={customer.status === "ACTIVE"}
                                disabled={togglingId === customer.id}
                                onClick={() => handleToggleStatus(customer.id)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  customer.status === "ACTIVE"
                                    ? "bg-emerald-500 hover:bg-emerald-600"
                                    : "bg-slate-300 hover:bg-slate-400"
                                } ${togglingId === customer.id ? "opacity-50 cursor-wait" : ""}`}
                              >
                                <span className="sr-only">Toggle Status Pelanggan</span>
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    customer.status === "ACTIVE"
                                      ? "translate-x-4"
                                      : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="h-4 w-px bg-slate-200" />

                            {/* Lihat Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerForDetail(customer)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0B4EA2] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                              title="Lihat Detail Pelanggan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => setEditingCustomer(customer)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                              title="Edit Data Pelanggan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(customer)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                              title="Hapus Pelanggan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delet</span>
                            </button>

                            {/* Expand 12-Month Billing Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleExpand(customer.id)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isExpanded
                                  ? "bg-[#0B4EA2] text-white border-[#0B4EA2]"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                              title={
                                isExpanded
                                  ? "Tutup Kartu Tagihan 12 Bulan"
                                  : "Buka Kartu Tagihan 12 Bulan"
                              }
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable 12-Month Billing Grid Sub-row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={7} className="p-4 sm:p-5">
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-[#0B4EA2]" />
                                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                    Kartu Tagihan 12 Bulan ({selectedYear}) —{" "}
                                    <span className="text-[#0B4EA2]">
                                      {customer.name}
                                    </span>
                                  </span>
                                  <span className="text-xs text-slate-500 font-medium">
                                    ({paidCountYear} dari 12 Bulan Lunas)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>Kirim Pengingat WhatsApp</span>
                                  </a>
                                </div>
                              </div>

                              {/* 12 Months Interactive Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                                {months.map((m, idx) => {
                                  const invoice = invoiceMap.get(m);
                                  const isPaid =
                                    invoice?.status === InvoiceStatus.PAID;
                                  const isCurrent =
                                    m === currentMonth &&
                                    selectedYear === currentRealYear;
                                  const isPast =
                                    selectedYear < currentRealYear ||
                                    (selectedYear === currentRealYear &&
                                      m < currentMonth);

                                  const waReceiptMessage = `*BUKTI PEMBAYARAN INTERNET tapakNet*\n\nNama: ${customer.name}\nPaket: ${customer.packageName}\nBulan: ${getMonthNameIndo(m)} ${selectedYear}\nJumlah: ${formatRupiah(invoice?.amount || customer.monthlyFee)}\nStatus: LUNAS (${invoice?.paidAt ? formatDateIndo(invoice.paidAt) : "Terbayar"})\nMetode: ${invoice?.paymentMethod || "CASH"}\n\nTerima kasih atas pembayaran Anda! 🙏`;
                                  const waReceiptLink = generateWhatsAppLink(
                                    customer.phone,
                                    waReceiptMessage
                                  );

                                  if (isPaid) {
                                    return (
                                      <div
                                        key={m}
                                        className="relative p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col justify-between transition-all"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] font-bold text-emerald-800">
                                            {shortMonths[idx]}
                                          </span>
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        </div>
                                        <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                                          LUNAS
                                        </div>
                                        <div className="text-[9px] text-emerald-600/80 truncate">
                                          {invoice.paidAt
                                            ? formatDateIndo(invoice.paidAt)
                                            : "Lunas"}
                                        </div>

                                        {/* Actions for Paid Month */}
                                        <div className="mt-1.5 pt-1 border-t border-emerald-200/60 flex items-center justify-center gap-2">
                                          <a
                                            href={waReceiptLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Kirim Struk via WhatsApp"
                                            className="text-emerald-700 hover:text-emerald-950 p-0.5"
                                          >
                                            <Receipt className="w-3.5 h-3.5" />
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleUnpayInvoice(customer, invoice)
                                            }
                                            title="Batalkan Status Lunas"
                                            className="text-rose-500 hover:text-rose-700 p-0.5"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Unpaid / Pending Month
                                  return (
                                    <div
                                      key={m}
                                      className={`p-2 rounded-xl border text-center flex flex-col justify-between transition-all ${
                                        isCurrent
                                          ? "bg-amber-50/80 border-amber-300"
                                          : isPast
                                          ? "bg-rose-50/50 border-rose-200"
                                          : "bg-slate-50 border-slate-200"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-700">
                                          {shortMonths[idx]}
                                        </span>
                                        {isCurrent ? (
                                          <Clock className="w-3 h-3 text-amber-500" />
                                        ) : isPast ? (
                                          <AlertCircle className="w-3 h-3 text-rose-400" />
                                        ) : null}
                                      </div>
                                      <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
                                        {invoice
                                          ? formatRupiah(invoice.amount)
                                          : formatRupiah(customer.monthlyFee)}
                                      </div>

                                      <div className="mt-1.5">
                                        {invoice ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setPayingInvoice({
                                                customer,
                                                invoice,
                                              })
                                            }
                                            className="w-full py-0.5 px-1 rounded text-[10px] font-bold bg-[#0B4EA2] hover:bg-blue-800 text-white transition-colors"
                                          >
                                            Bayar
                                          </button>
                                        ) : (
                                          <span className="text-[9px] text-slate-400 italic">
                                            -
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal (Lihat) */}
      {selectedCustomerForDetail && (
        <CustomerDetailModal
          customer={selectedCustomerForDetail}
          selectedYear={selectedYear}
          onClose={() => setSelectedCustomerForDetail(null)}
          onEdit={() => {
            const cust = selectedCustomerForDetail;
            setSelectedCustomerForDetail(null);
            setEditingCustomer(cust);
          }}
          onDelete={() => {
            const cust = selectedCustomerForDetail;
            setSelectedCustomerForDetail(null);
            handleDeleteCustomer(cust);
          }}
        />
      )}

      {/* Pay Invoice Modal */}
      {payingInvoice && (
        <PayInvoiceModal
          customer={payingInvoice.customer}
          invoice={payingInvoice.invoice}
          onClose={() => setPayingInvoice(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          odpNodes={odpNodes}
          availableDevices={availableDevices}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          odpNodes={odpNodes}
          onClose={() => setEditingCustomer(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Custom Confirm Dialog Card */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={confirmLoading}
        onConfirm={handleExecuteConfirm}
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
}