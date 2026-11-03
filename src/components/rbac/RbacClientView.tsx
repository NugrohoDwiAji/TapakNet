"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PERMISSION_MODULES,
  ROLE_INFO,
  PermissionModuleGroup,
  ALL_PERMISSION_KEYS,
} from "@/lib/permissions";
import {
  updateRolePermissions,
  resetRolePermissionsToDefault,
} from "@/actions/rbac-actions";
import ConfirmDialog, { ConfirmVariant } from "@/components/ui/ConfirmDialog";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Check,
  RotateCcw,
  Save,
  Users,
  Wifi,
  Network,
  BookOpenCheck,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  UserCog,
  Wrench,
  DollarSign,
  Loader2,
} from "lucide-react";
import { UserRole } from "@/lib/permissions";

interface RoleProfileData {
  id: string;
  role: UserRole;
  displayName: string;
  description: string | null;
  permissions: string[];
  updatedAt: Date;
}

interface RbacClientViewProps {
  roleProfiles: RoleProfileData[];
}

export default function RbacClientView({ roleProfiles }: RbacClientViewProps) {
  const router = useRouter();

  // Active selected role tab: "ALL" for full matrix, or specific role
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole | "ALL">("ALL");

  // Local state for permissions map: Record<UserRole, Set<string>>
  const [permissionsState, setPermissionsState] = useState<Record<UserRole, Set<string>>>(() => {
    const initial: Record<UserRole, Set<string>> = {
      ADMIN: new Set(),
      TECHNICIAN: new Set(),
      FINANCE: new Set(),
    };
    roleProfiles.forEach((p) => {
      initial[p.role] = new Set(p.permissions);
    });
    return initial;
  });

  const [savingRole, setSavingRole] = useState<UserRole | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Confirm dialog state for resetting
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

  // Toggle single permission for a role
  const handleTogglePermission = (role: UserRole, permKey: string) => {
    // Admin must always retain rbac:manage
    if (role === UserRole.ADMIN && permKey === "rbac:manage") {
      return;
    }

    setPermissionsState((prev) => {
      const currentSet = new Set(prev[role]);
      if (currentSet.has(permKey)) {
        currentSet.delete(permKey);
      } else {
        currentSet.add(permKey);
      }
      return {
        ...prev,
        [role]: currentSet,
      };
    });
  };

  // Toggle entire module for a role
  const handleToggleModule = (role: UserRole, moduleGroup: PermissionModuleGroup) => {
    const moduleKeys = moduleGroup.permissions.map((p) => p.key);
    const currentSet = permissionsState[role];
    const allModuleGranted = moduleKeys.every((k) => currentSet.has(k));

    setPermissionsState((prev) => {
      const nextSet = new Set(prev[role]);
      if (allModuleGranted) {
        // Revoke all in this module (except rbac:manage on admin)
        moduleKeys.forEach((k) => {
          if (!(role === UserRole.ADMIN && k === "rbac:manage")) {
            nextSet.delete(k);
          }
        });
      } else {
        // Grant all in this module
        moduleKeys.forEach((k) => nextSet.add(k));
      }
      return {
        ...prev,
        [role]: nextSet,
      };
    });
  };

  // Save changes for a single role
  const handleSaveRole = async (role: UserRole) => {
    try {
      setSavingRole(role);
      const permArray = Array.from(permissionsState[role]);
      await updateRolePermissions(role, permArray);
      setSaveSuccessMsg(`Hak akses role ${ROLE_INFO[role].name} berhasil disimpan!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan hak akses");
    } finally {
      setSavingRole(null);
    }
  };

  // Save changes for all roles
  const handleSaveAll = async () => {
    try {
      setSavingAll(true);
      const roles: UserRole[] = [UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.FINANCE];
      await Promise.all(
        roles.map((r) => updateRolePermissions(r, Array.from(permissionsState[r])))
      );
      setSaveSuccessMsg("Semua perubahan hak akses (RBAC) berhasil disimpan!");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan perubahan");
    } finally {
      setSavingAll(false);
    }
  };

  // Reset role to default
  const handleResetRole = (role: UserRole) => {
    setConfirmDialog({
      isOpen: true,
      title: `Reset Hak Akses ${ROLE_INFO[role].name}`,
      description: `Apakah Anda yakin ingin mengembalikan seluruh izin role ${ROLE_INFO[role].name} ke pengaturan standar bawaan sistem?`,
      confirmText: "Ya, Reset ke Standar",
      variant: "warning",
      action: async () => {
        await resetRolePermissionsToDefault(role);
        router.refresh();
      },
    });
  };

  const handleExecuteConfirm = async () => {
    if (!confirmDialog.action) return;
    try {
      setConfirmLoading(true);
      await confirmDialog.action();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat memproses");
    } finally {
      setConfirmLoading(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Helper for module icon
  const getModuleIcon = (id: string) => {
    switch (id) {
      case "dashboard":
        return LayoutDashboard;
      case "hotspot":
        return Wifi;
      case "customers":
        return Users;
      case "infrastructure":
        return Network;
      case "finance":
        return BookOpenCheck;
      case "security":
      default:
        return ShieldCheck;
    }
  };

  const rolesList: UserRole[] = [UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.FINANCE];

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation: Users vs RBAC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Link
            href="/users"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <UserCog className="w-4 h-4" />
            <span>Daftar Pengguna</span>
          </Link>

          <Link
            href="/rbac"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0B4EA2] text-white shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Matriks Hak Akses (RBAC)</span>
          </Link>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-2">
          {saveSuccessMsg && (
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={savingAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-sm shadow-blue-900/20 disabled:opacity-60 cursor-pointer"
          >
            {savingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Semua Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Role Profile Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rolesList.map((role) => {
          const info = ROLE_INFO[role];
          const grantedCount = permissionsState[role].size;
          const totalCount = ALL_PERMISSION_KEYS.length;
          const isSelected = selectedRoleTab === role;

          return (
            <div
              key={role}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                isSelected
                  ? "border-[#0B4EA2] ring-2 ring-[#0B4EA2]/20 shadow-md"
                  : "border-slate-200/80 shadow-xs hover:border-slate-300"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-bold border ${info.badgeColor}`}
                  >
                    {role === UserRole.ADMIN ? (
                      <Shield className="w-3.5 h-3.5" />
                    ) : role === UserRole.TECHNICIAN ? (
                      <Wrench className="w-3.5 h-3.5" />
                    ) : (
                      <DollarSign className="w-3.5 h-3.5" />
                    )}
                    <span>{role}</span>
                  </span>

                  <span className="text-xs font-semibold text-slate-500">
                    <strong className="text-slate-800">{grantedCount}</strong> / {totalCount} Izin
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{info.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{info.description}</p>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoleTab(selectedRoleTab === role ? "ALL" : role)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 text-[#0B4EA2]"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {isSelected ? "Tampilkan Semua" : "Filter Role Ini"}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleResetRole(role)}
                    title="Kembalikan ke standar default"
                    className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveRole(role)}
                    disabled={savingRole === role}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#0B4EA2] text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {savingRole === role ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-5 h-5 text-[#0B4EA2] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-bold text-[#072255]">
            Panduan Hak Akses Berbasis Peran (Role-Based Access Control)
          </p>
          <p className="text-slate-600">
            Centang kotak pada kolom role untuk memberikan hak izin fitur, atau klik nama modul untuk
            mengaktifkan/menonaktifkan seluruh izin modul sekaligus. Akun <strong>ADMIN</strong> selalu
            mempertahankan hak akses konfigurasi RBAC demi keamanan sistem.
          </p>
        </div>
      </div>

      {/* RBAC Permission Matrix Table */}
      <div className="space-y-6">
        {PERMISSION_MODULES.map((moduleGroup) => {
          const ModuleIcon = getModuleIcon(moduleGroup.id);

          return (
            <div
              key={moduleGroup.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
            >
              {/* Module Header */}
              <div className="bg-slate-50/90 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-200/60">
                    <ModuleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#072255] text-sm">{moduleGroup.name}</h3>
                    <p className="text-xs text-slate-500">{moduleGroup.description}</p>
                  </div>
                </div>

                {/* Quick Toggle for entire module */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
                    Toggle Cepat Modul:
                  </span>
                  {rolesList.map((r) => {
                    if (selectedRoleTab !== "ALL" && selectedRoleTab !== r) return null;
                    const allGranted = moduleGroup.permissions.every((p) =>
                      permissionsState[r].has(p.key)
                    );

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleToggleModule(r, moduleGroup)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                          allGranted
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                        }`}
                        title={`Klik untuk ubah semua izin modul ${moduleGroup.name} pada role ${r}`}
                      >
                        {allGranted ? `✓ ${r}` : `+ ${r}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Permissions Rows */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-5">Wewenang & Deskripsi Fitur</th>
                      <th className="py-2.5 px-3 text-slate-400 font-mono text-[10px] w-48">
                        Permission Key
                      </th>
                      {rolesList.map((r) => {
                        if (selectedRoleTab !== "ALL" && selectedRoleTab !== r) return null;
                        return (
                          <th key={r} className="py-2.5 px-4 text-center w-28 whitespace-nowrap">
                            {r}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {moduleGroup.permissions.map((perm) => {
                      return (
                        <tr key={perm.key} className="hover:bg-blue-50/30 transition-colors">
                          {/* Label & Description */}
                          <td className="py-3 px-5">
                            <div className="font-bold text-slate-800 text-xs">{perm.label}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {perm.description}
                            </div>
                          </td>

                          {/* Permission Key */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {perm.key}
                          </td>

                          {/* Role Checkboxes */}
                          {rolesList.map((r) => {
                            if (selectedRoleTab !== "ALL" && selectedRoleTab !== r) return null;
                            const isChecked = permissionsState[r].has(perm.key);
                            const isLockedAdmin = r === UserRole.ADMIN && perm.key === "rbac:manage";

                            return (
                              <td key={r} className="py-3 px-4 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isLockedAdmin}
                                    onChange={() => handleTogglePermission(r, perm.key)}
                                    className={`w-4 h-4 rounded text-[#0B4EA2] focus:ring-[#0B4EA2] transition-all cursor-pointer ${
                                      isLockedAdmin
                                        ? "opacity-60 cursor-not-allowed text-purple-600"
                                        : ""
                                    }`}
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Bar when changes are made */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-[#0B4EA2]" />
          <span>Pengaturan hak akses akan langsung berlaku saat pengguna memuat ulang halaman.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={savingAll}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/20 disabled:opacity-60 cursor-pointer"
          >
            {savingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan RBAC</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={confirmLoading}
        onConfirm={handleExecuteConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
