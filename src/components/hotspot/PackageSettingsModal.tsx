"use client";

import { useState } from "react";
import {
  createVoucherPackage,
  updateVoucherPackage,
  deleteVoucherPackage,
} from "@/actions/voucher-actions";
import EditPackageModal from "./EditPackageModal";
import ConfirmDialog, { ConfirmVariant } from "@/components/ui/ConfirmDialog";
import { X, Settings2, Plus, Check, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface PackageSettingsModalProps {
  packages: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function PackageSettingsModal({
  packages,
  onClose,
  onSuccess,
}: PackageSettingsModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sellPrice: "",
    defaultOwnerShare: "",
    defaultPartnerFee: "",
  });

  const [selectedPkgForEdit, setSelectedPkgForEdit] = useState<any | null>(null);
  const [deletingPkgId, setDeletingPkgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Auto calculate partner fee when sell price and owner share are entered
  const handleOwnerShareChange = (val: string) => {
    const owner = Number(val) || 0;
    const sell = Number(formData.sellPrice) || 0;
    const fee = Math.max(0, sell - owner);
    setFormData((prev) => ({
      ...prev,
      defaultOwnerShare: val,
      defaultPartnerFee: fee.toString(),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sell = Number(formData.sellPrice);
    const owner = Number(formData.defaultOwnerShare);
    const fee = Number(formData.defaultPartnerFee);

    if (sell <= 0 || owner <= 0) {
      setError("Harga jual dan setoran owner harus lebih dari 0");
      return;
    }

    try {
      setLoading(true);
      await createVoucherPackage({
        name: formData.name,
        sellPrice: sell,
        defaultOwnerShare: owner,
        defaultPartnerFee: fee,
      });

      setFormData({ name: "", sellPrice: "", defaultOwnerShare: "", defaultPartnerFee: "" });
      setShowAddForm(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gagal membuat paket voucher baru");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (pkg: any) => {
    try {
      await updateVoucherPackage(pkg.id, { isActive: !pkg.isActive });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui status paket");
    }
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
          onSuccess();
        } catch (err: any) {
          setError(err.message || "Gagal menghapus paket voucher");
        } finally {
          setDeletingPkgId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">Pengaturan Master Paket Voucher</h3>
              <p className="text-xs text-slate-500">
                Konfigurasi harga jual dan pembagian komisi mitra warung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing Packages List */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Daftar Paket Terdaftar</span>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#0B4EA2] text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Paket
              </button>
            )}
          </div>

          <div className="space-y-2">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  pkg.isActive
                    ? "bg-white border-slate-200 shadow-sm"
                    : "bg-slate-50 border-slate-200/60 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#072255]">{pkg.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        pkg.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {pkg.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3">
                    <span>
                      Jual: <strong className="text-slate-800">{formatRupiah(pkg.sellPrice)}</strong>
                    </span>
                    <span>
                      Setor Owner:{" "}
                      <strong className="text-[#0B4EA2]">
                        {formatRupiah(pkg.defaultOwnerShare)}
                      </strong>
                    </span>
                    <span>
                      Fee Warung:{" "}
                      <strong className="text-emerald-600">
                        {formatRupiah(pkg.defaultPartnerFee)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setSelectedPkgForEdit(pkg)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                    title="Edit Paket"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                    disabled={deletingPkgId === pkg.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                    title="Hapus Paket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(pkg)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-colors border ${
                      pkg.isActive
                        ? "text-slate-600 border-slate-200 hover:bg-slate-100"
                        : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    {pkg.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Add New Package */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="mt-6 p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 animate-in fade-in"
          >
            <div className="text-xs font-bold text-[#072255]">Tambah Paket Voucher Baru</div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nama Paket *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Voucher 10.000 (3 Hari)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Harga Jual (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="10000"
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Hak Owner (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="8500"
                  value={formData.defaultOwnerShare}
                  onChange={(e) => handleOwnerShareChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold text-[#0B4EA2]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Fee Warung (Rp)
                </label>
                <input
                  type="number"
                  value={formData.defaultPartnerFee}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultPartnerFee: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold text-emerald-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0B4EA2] hover:bg-blue-800 rounded-lg transition-colors shadow-sm"
              >
                {loading ? "Menyimpan..." : "Simpan Paket"}
              </button>
            </div>
          </form>
        )}

        <div className="pt-5 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Edit Package Modal */}
      {selectedPkgForEdit && (
        <EditPackageModal
          pkg={selectedPkgForEdit}
          onClose={() => setSelectedPkgForEdit(null)}
          onSuccess={onSuccess}
        />
      )}

      {/* Custom Confirm Dialog Card */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={deletingPkgId !== null}
        onConfirm={() => {
          if (confirmDialog.action) confirmDialog.action();
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
