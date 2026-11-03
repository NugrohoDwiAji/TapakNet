"use client";

import { useState, Fragment } from "react";
import { formatRupiah, formatDateIndo, generateWhatsAppLink } from "@/lib/utils";
import {
  deleteHotspotPartner,
  deleteVoucherPackage,
  createVoucherPackage,
  updateVoucherPackage,
} from "@/actions/voucher-actions";
import DropVoucherModal from "./DropVoucherModal";
import SettlementModal from "./SettlementModal";
import PayUnpaidBalanceModal from "./PayUnpaidBalanceModal";
import AddPartnerModal from "./AddPartnerModal";
import PackageSettingsModal from "./PackageSettingsModal";
import EditPartnerModal from "./EditPartnerModal";
import PartnerDetailModal from "./PartnerDetailModal";
import EditPackageModal from "./EditPackageModal";
import ConfirmDialog, { ConfirmVariant } from "@/components/ui/ConfirmDialog";
import {
  Wifi,
  Store,
  PackagePlus,
  Calculator,
  HandCoins,
  Plus,
  Settings,
  Settings2,
  Phone,
  MapPin,
  AlertCircle,
  Search,
  CheckCircle2,
  ChevronDown,
  History,
  Radio,
  Eye,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface HotspotClientViewProps {
  partners: any[];
  packages: any[];
  odpNodes: any[];
}

export default function HotspotClientView({
  partners,
  packages,
  odpNodes,
}: HotspotClientViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"PARTNERS" | "PACKAGES">("PARTNERS");
  const [search, setSearch] = useState("");
  const [selectedPartnerForDrop, setSelectedPartnerForDrop] = useState<any | null>(null);
  const [selectedPartnerForSettlement, setSelectedPartnerForSettlement] = useState<any | null>(null);
  const [selectedPartnerForPayDebt, setSelectedPartnerForPayDebt] = useState<any | null>(null);
  const [selectedPartnerForDetail, setSelectedPartnerForDetail] = useState<any | null>(null);
  const [selectedPartnerForEdit, setSelectedPartnerForEdit] = useState<any | null>(null);
  const [selectedPkgForEdit, setSelectedPkgForEdit] = useState<any | null>(null);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showPackageSettings, setShowPackageSettings] = useState(false);
  const [showAddPackageForm, setShowAddPackageForm] = useState(false);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingPkgId, setDeletingPkgId] = useState<string | null>(null);

  // Form state for creating new package on the PACKAGES tab
  const [newPkgForm, setNewPkgForm] = useState({
    name: "",
    sellPrice: "",
    defaultOwnerShare: "",
    defaultPartnerFee: "",
  });
  const [pkgLoading, setPkgLoading] = useState(false);
  const [pkgError, setPkgError] = useState<string | null>(null);

  // Custom Confirm Card State
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

  // Refresh handler
  const handleSuccess = () => {
    router.refresh();
  };

  const handleDeletePartner = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Mitra Hotspot",
      description: `Apakah Anda yakin ingin menghapus mitra hotspot "${name}"? Seluruh riwayat distribusi dan setoran voucher terkait akan dihapus, dan perangkat yang terpasang akan otomatis dikembalikan ke status Ready di Gudang.`,
      confirmText: "Hapus Mitra",
      variant: "danger",
      action: async () => {
        try {
          setDeletingId(id);
          await deleteHotspotPartner(id);
          handleSuccess();
        } catch (err: any) {
          alert(err.message || "Gagal menghapus mitra hotspot");
        } finally {
          setDeletingId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeletePackage = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Paket Voucher",
      description: `Apakah Anda yakin ingin menghapus paket "${name}"? Seluruh alokasi stok paket ini pada warung mitra akan ikut dihapus.`,
      confirmText: "Hapus Paket",
      variant: "danger",
      action: async () => {
        try {
          setDeletingPkgId(id);
          await deleteVoucherPackage(id);
          handleSuccess();
        } catch (err: any) {
          alert(err.message || "Gagal menghapus paket voucher");
        } finally {
          setDeletingPkgId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleOwnerShareChange = (val: string) => {
    const owner = Number(val) || 0;
    const sell = Number(newPkgForm.sellPrice) || 0;
    const fee = Math.max(0, sell - owner);
    setNewPkgForm((prev) => ({
      ...prev,
      defaultOwnerShare: val,
      defaultPartnerFee: fee.toString(),
    }));
  };

  const handleSellPriceChange = (val: string) => {
    const sell = Number(val) || 0;
    const owner = Number(newPkgForm.defaultOwnerShare) || 0;
    const fee = Math.max(0, sell - owner);
    setNewPkgForm((prev) => ({
      ...prev,
      sellPrice: val,
      defaultPartnerFee: fee.toString(),
    }));
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setPkgError(null);

    const sell = Number(newPkgForm.sellPrice);
    const owner = Number(newPkgForm.defaultOwnerShare);
    const fee = Number(newPkgForm.defaultPartnerFee);

    if (sell <= 0 || owner <= 0) {
      setPkgError("Harga jual dan setoran owner harus lebih besar dari 0");
      return;
    }

    try {
      setPkgLoading(true);
      await createVoucherPackage({
        name: newPkgForm.name.trim(),
        sellPrice: sell,
        defaultOwnerShare: owner,
        defaultPartnerFee: fee,
      });

      setNewPkgForm({ name: "", sellPrice: "", defaultOwnerShare: "", defaultPartnerFee: "" });
      setShowAddPackageForm(false);
      handleSuccess();
    } catch (err: any) {
      setPkgError(err.message || "Gagal membuat paket voucher baru");
    } finally {
      setPkgLoading(false);
    }
  };

  const handleTogglePackageStatus = async (pkg: any) => {
    try {
      await updateVoucherPackage(pkg.id, { isActive: !pkg.isActive });
      handleSuccess();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui status paket");
    }
  };

  // Package summary metrics
  const activePackagesCount = packages.filter((p) => p.isActive).length;
  const avgPartnerFee =
    packages.length > 0
      ? Math.round(
          packages.reduce((sum, p) => sum + (p.defaultPartnerFee || 0), 0) / packages.length
        )
      : 0;

  // Filtered partners
  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
  );

  // Total summary calculations
  const totalPhysicalStock = partners.reduce((sum, p) => {
    return sum + p.stocks.reduce((s: number, st: any) => s + st.quantity, 0);
  }, 0);

  const totalPiutangWarung = partners.reduce((sum, p) => sum + p.unpaidBalance, 0);

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab("PARTNERS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "PARTNERS"
                ? "bg-white text-[#072255] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="w-4 h-4 text-[#0B4EA2]" />
            <span>Data Titik Hotspot & Mitra ({partners.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("PACKAGES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "PACKAGES"
                ? "bg-white text-[#072255] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Settings2 className="w-4 h-4 text-[#0B4EA2]" />
            <span>Master Paket & Setting ({packages.length})</span>
          </button>
        </div>

        {activeTab === "PARTNERS" ? (
          <button
            onClick={() => setShowAddPartner(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Mitra Baru</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAddPackageForm(!showAddPackageForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddPackageForm ? "Tutup Form Tambah" : "Tambah Paket Baru"}</span>
          </button>
        )}
      </div>

      {/* TAB 1: DATA TITIK HOTSPOT & MITRA */}
      {activeTab === "PARTNERS" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Action & Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-100">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Mitra Aktif
                </div>
                <div className="text-xl font-black text-[#072255]">{partners.length} Warung / Titik</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Wifi className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Voucher di Lapangan
                </div>
                <div className="text-xl font-black text-emerald-700">{totalPhysicalStock} Lembar</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <HandCoins className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Piutang Mitra
                </div>
                <div className="text-xl font-black text-amber-700">
                  {formatRupiah(totalPiutangWarung)}
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari warung, pemilik, atau alamat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-slate-50/50"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-[#072255]">{filteredPartners.length}</span> dari {partners.length} mitra warung
            </div>
          </div>

          {/* Partners Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Nama Warung & Lokasi</th>
                    <th className="py-3.5 px-4">Pemilik & Kontak</th>
                    <th className="py-3.5 px-4">Koneksi ODP</th>
                    <th className="py-3.5 px-4">Stok Fisik Voucher</th>
                    <th className="py-3.5 px-4">Status Piutang</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Store className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-medium">Tidak ada mitra yang cocok dengan pencarian.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((partner) => {
                      const isExpanded = expandedPartnerId === partner.id;
                      const totalStockPartner = partner.stocks.reduce(
                        (acc: number, s: any) => acc + s.quantity,
                        0
                      );

                      // WhatsApp message for quick balance reminder
                      const waReminderText = `Halo ${partner.ownerName} (${partner.name}), dari Tim tapakNet. Mengingatkan info saldo setoran voucher hotspot Anda saat ini terdapat kurang bayar sebesar ${formatRupiah(partner.unpaidBalance)}. Terima kasih 🙏`;
                      const waLink = generateWhatsAppLink(partner.phone, waReminderText);

                      return (
                        <Fragment key={partner.id}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            {/* Column 1: Nama Warung & Lokasi */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#072255]">
                                  {partner.name}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate max-w-[200px]" title={partner.address}>
                                  {partner.address}
                                </span>
                              </div>
                            </td>

                            {/* Column 2: Pemilik & Kontak */}
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-800 block text-xs">
                                {partner.ownerName}
                              </span>
                              <a
                                href={`https://wa.me/${partner.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline font-medium mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                {partner.phone}
                              </a>
                            </td>

                            {/* Column 3: Koneksi ODP */}
                            <td className="py-3.5 px-4">
                              {partner.odp ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0B4EA2] border border-blue-100 inline-flex items-center gap-1">
                                  <Radio className="w-3 h-3" />
                                  {partner.odp.code} (Port {partner.odpPort ?? "-"})
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                                  Wireless / Direct
                                </span>
                              )}
                            </td>

                            {/* Column 4: Stok Fisik Voucher */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]">
                                {packages.map((pkg) => {
                                  const stock =
                                    partner.stocks.find((s: any) => s.packageId === pkg.id)?.quantity || 0;
                                  return (
                                    <span
                                      key={pkg.id}
                                      className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]"
                                    >
                                      <span className="text-slate-400 mr-1">{pkg.name}:</span>
                                      <strong className="text-[#072255] font-black">{stock}</strong>
                                    </span>
                                  );
                                })}
                                <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-[11px] font-black text-[#0B4EA2]">
                                  Total: {totalStockPartner}
                                </span>
                              </div>
                            </td>

                            {/* Column 5: Status Piutang */}
                            <td className="py-3.5 px-4">
                              {partner.unpaidBalance > 0 ? (
                                <div className="space-y-1">
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {formatRupiah(partner.unpaidBalance)}
                                  </span>
                                  <div>
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-emerald-600 hover:underline font-semibold"
                                    >
                                      Tagih via WA
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Bersih
                                </span>
                              )}
                            </td>

                            {/* Column 6: Aksi */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end flex-wrap gap-1">
                                <button
                                  onClick={() => setSelectedPartnerForDetail(partner)}
                                  className="p-1.5 text-slate-600 hover:text-[#0B4EA2] hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                                  title="Lihat Detail Mitra"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setSelectedPartnerForEdit(partner)}
                                  className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-slate-200"
                                  title="Edit Data Mitra"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeletePartner(partner.id, partner.name)}
                                  disabled={deletingId === partner.id}
                                  className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
                                  title="Hapus Mitra"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setSelectedPartnerForDrop(partner)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#0B4EA2] hover:bg-blue-100 font-semibold text-[11px] transition-colors border border-blue-200/60"
                                  title="Drop Stok Voucher"
                                >
                                  <PackagePlus className="w-3 h-3" />
                                  <span>Drop</span>
                                </button>

                                <button
                                  onClick={() => setSelectedPartnerForSettlement(partner)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B4EA2] text-white hover:bg-blue-800 font-semibold text-[11px] transition-colors shadow-2xs"
                                  title="Tarik Setoran"
                                >
                                  <Calculator className="w-3 h-3" />
                                  <span>Tarik</span>
                                </button>

                                {partner.unpaidBalance > 0 && (
                                  <button
                                    onClick={() => setSelectedPartnerForPayDebt(partner)}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-[11px] transition-colors"
                                    title="Pelunasan Piutang"
                                  >
                                    <HandCoins className="w-3 h-3" />
                                    <span>Bayar</span>
                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    setExpandedPartnerId(isExpanded ? null : partner.id)
                                  }
                                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                  title="Riwayat Setoran"
                                >
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row: Recent Settlements History */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td colSpan={6} className="px-5 py-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#072255]">
                                      <History className="w-3.5 h-3.5 text-[#0B4EA2]" />
                                      <span>Riwayat 3 Setoran Terakhir ({partner.name})</span>
                                    </div>
                                    {partner.unpaidBalance > 0 && (
                                      <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                                      >
                                        <Phone className="w-3 h-3" />
                                        Kirim Pengingat Piutang via WhatsApp
                                      </a>
                                    )}
                                  </div>

                                  {partner.settlements?.length === 0 ? (
                                    <p className="text-xs text-slate-400 py-1">
                                      Belum ada riwayat penarikan setoran untuk warung ini.
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                                      {partner.settlements.map((st: any) => (
                                        <div
                                          key={st.id}
                                          className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs space-y-1"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800">
                                              {formatDateIndo(st.settlementDate)}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                              #{st.id.slice(0, 6)}
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-slate-500 truncate">
                                            {st.items
                                              ?.map(
                                                (i: any) =>
                                                  `${i.package?.name}: ${i.soldQuantity} pcs`
                                              )
                                              .join(", ") || "-"}
                                          </div>
                                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                            <span className="font-bold text-emerald-700">
                                              {formatRupiah(st.actualReceived)}
                                            </span>
                                            {st.shortfallAmount > 0 && (
                                              <span className="font-bold text-rose-600">
                                                Kurang: {formatRupiah(st.shortfallAmount)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER PAKET & SETTING */}
      {activeTab === "PACKAGES" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Packages KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-100">
                <PackagePlus className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Paket Terdaftar
                </div>
                <div className="text-xl font-black text-[#072255]">{packages.length} Paket</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Paket Aktif Berjalan
                </div>
                <div className="text-xl font-black text-emerald-700">{activePackagesCount} Paket Aktif</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <HandCoins className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Rata-rata Fee Warung
                </div>
                <div className="text-xl font-black text-amber-700">
                  {formatRupiah(avgPartnerFee)} / pcs
                </div>
              </div>
            </div>
          </div>

          {/* Form Add Package Inline */}
          {showAddPackageForm && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-blue-200 shadow-sm animate-in fade-in space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B4EA2] flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#072255]">Tambah Paket Voucher Baru</h4>
                    <p className="text-xs text-slate-500">
                      Tentukan harga jual, porsi owner, dan komisi fee untuk mitra warung
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddPackageForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Tutup
                </button>
              </div>

              {pkgError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{pkgError}</span>
                </div>
              )}

              <form onSubmit={handleCreatePackage} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Paket *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Voucher 10.000 (3 Hari)"
                      value={newPkgForm.name}
                      onChange={(e) => setNewPkgForm({ ...newPkgForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Harga Jual (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      placeholder="10000"
                      value={newPkgForm.sellPrice}
                      onChange={(e) => handleSellPriceChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hak Setor Owner (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      placeholder="8500"
                      value={newPkgForm.defaultOwnerShare}
                      onChange={(e) => handleOwnerShareChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0B4EA2] focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fee Warung (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="1500"
                      value={newPkgForm.defaultPartnerFee}
                      onChange={(e) =>
                        setNewPkgForm({ ...newPkgForm, defaultPartnerFee: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPackageForm(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={pkgLoading}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0B4EA2] hover:bg-blue-800 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    {pkgLoading ? "Menyimpan..." : "Simpan Paket"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Cards Master Paket Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#072255]">
                  Daftar Master Paket Voucher
                </h3>
                <p className="text-xs text-slate-500">
                  Semua kartu paket terdaftar di sistem dengan tombol edit dan delete
                </p>
              </div>

              {!showAddPackageForm && (
                <button
                  onClick={() => setShowAddPackageForm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-[#0B4EA2] hover:bg-blue-100 text-xs font-semibold transition-colors border border-blue-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Paket Baru</span>
                </button>
              )}
            </div>

            {packages.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <PackagePlus className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">Belum ada master paket voucher yang dibuat.</p>
                <button
                  onClick={() => setShowAddPackageForm(true)}
                  className="mt-3 px-4 py-2 text-xs font-bold text-[#0B4EA2] bg-blue-50 rounded-xl hover:bg-blue-100 inline-block"
                >
                  Buat Paket Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`bg-white rounded-2xl p-5 border transition-all shadow-sm flex flex-col justify-between gap-4 ${
                      pkg.isActive
                        ? "border-slate-200 hover:border-blue-300"
                        : "border-slate-200/60 opacity-60 bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B4EA2] flex items-center justify-center font-bold">
                            <Wifi className="w-4 h-4" />
                          </div>
                          <h4 className="font-bold text-base text-[#072255] truncate">
                            {pkg.name}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                            pkg.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {pkg.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">
                            Harga Jual
                          </div>
                          <div className="text-xs sm:text-sm font-black text-slate-800 mt-1">
                            {formatRupiah(pkg.sellPrice)}
                          </div>
                        </div>
                        <div className="border-x border-slate-200">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">
                            Setor Owner
                          </div>
                          <div className="text-xs sm:text-sm font-black text-[#0B4EA2] mt-1">
                            {formatRupiah(pkg.defaultOwnerShare)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">
                            Fee Warung
                          </div>
                          <div className="text-xs sm:text-sm font-black text-emerald-600 mt-1">
                            {formatRupiah(pkg.defaultPartnerFee)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Each Package: Edit, Delete, Toggle Status */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleTogglePackageStatus(pkg)}
                        className={`text-[11px] px-2.5 py-1.5 rounded-xl font-semibold transition-colors border ${
                          pkg.isActive
                            ? "text-slate-600 border-slate-200 hover:bg-slate-100"
                            : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        {pkg.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPkgForEdit(pkg)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                          title="Edit Paket"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                          disabled={deletingPkgId === pkg.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                          title="Delete Paket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedPartnerForDetail && (
        <PartnerDetailModal
          partner={selectedPartnerForDetail}
          packages={packages}
          onClose={() => setSelectedPartnerForDetail(null)}
          onDropStock={() => setSelectedPartnerForDrop(selectedPartnerForDetail)}
          onSettlement={() => setSelectedPartnerForSettlement(selectedPartnerForDetail)}
          onEdit={() => setSelectedPartnerForEdit(selectedPartnerForDetail)}
          onDelete={() =>
            handleDeletePartner(
              selectedPartnerForDetail.id,
              selectedPartnerForDetail.name
            )
          }
        />
      )}

      {selectedPartnerForEdit && (
        <EditPartnerModal
          partner={selectedPartnerForEdit}
          odpNodes={odpNodes}
          onClose={() => setSelectedPartnerForEdit(null)}
          onSuccess={handleSuccess}
        />
      )}

      {selectedPartnerForDrop && (
        <DropVoucherModal
          partner={selectedPartnerForDrop}
          packages={packages}
          onClose={() => setSelectedPartnerForDrop(null)}
          onSuccess={handleSuccess}
        />
      )}

      {selectedPartnerForSettlement && (
        <SettlementModal
          partner={selectedPartnerForSettlement}
          packages={packages}
          onClose={() => setSelectedPartnerForSettlement(null)}
          onSuccess={handleSuccess}
        />
      )}

      {selectedPartnerForPayDebt && (
        <PayUnpaidBalanceModal
          partner={selectedPartnerForPayDebt}
          onClose={() => setSelectedPartnerForPayDebt(null)}
          onSuccess={handleSuccess}
        />
      )}

      {showAddPartner && (
        <AddPartnerModal
          odpNodes={odpNodes}
          onClose={() => setShowAddPartner(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showPackageSettings && (
        <PackageSettingsModal
          packages={packages}
          onClose={() => setShowPackageSettings(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Edit Package Modal */}
      {selectedPkgForEdit && (
        <EditPackageModal
          pkg={selectedPkgForEdit}
          onClose={() => setSelectedPkgForEdit(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Custom Confirmation Card */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={deletingId !== null || deletingPkgId !== null}
        onConfirm={() => {
          if (confirmDialog.action) confirmDialog.action();
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
