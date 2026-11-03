"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDateIndo } from "@/lib/utils";
import { toggleUserStatus, deleteUser } from "@/actions/user-actions";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import ConfirmDialog, { ConfirmVariant } from "@/components/ui/ConfirmDialog";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  Wrench,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { UserRole } from "@/lib/permissions";

interface UsersClientViewProps {
  users: any[];
}

export default function UsersClientView({ users }: UsersClientViewProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
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

  const handleToggleStatus = async (user: any) => {
    try {
      setTogglingId(user.id);
      await toggleUserStatus(user.id);
      handleRefresh();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status pengguna");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteUser = (user: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Pengguna",
      description: `Apakah Anda yakin ingin menghapus akun "${user.name}" (@${user.username})? Pengguna ini tidak akan bisa login lagi ke sistem.`,
      confirmText: "Ya, Hapus Pengguna",
      variant: "danger",
      action: async () => {
        await deleteUser(user.id);
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
      alert(err.message || "Terjadi kesalahan saat memproses");
    } finally {
      setConfirmLoading(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "INACTIVE" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === UserRole.ADMIN && u.isActive).length;
  const techCount = users.filter((u) => u.role === UserRole.TECHNICIAN && u.isActive).length;
  const financeCount = users.filter((u) => u.role === UserRole.FINANCE && u.isActive).length;

  const currentUserId = (session?.user as any)?.id;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return {
          label: "ADMIN",
          icon: Shield,
          style: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case UserRole.TECHNICIAN:
        return {
          label: "TECHNICIAN",
          icon: Wrench,
          style: "bg-blue-50 text-[#0B4EA2] border-blue-200",
        };
      case UserRole.FINANCE:
        return {
          label: "FINANCE",
          icon: DollarSign,
          style: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return {
          label: role,
          icon: Users,
          style: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation: Users vs RBAC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Link
            href="/users"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0B4EA2] text-white shadow-xs"
          >
            <UserCog className="w-4 h-4" />
            <span>Daftar Pengguna</span>
          </Link>

          <Link
            href="/rbac"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Matriks Hak Akses (RBAC)</span>
          </Link>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pengguna
            </div>
            <div className="text-xl font-black text-[#072255]">
              {totalUsers} <span className="text-xs font-normal text-slate-400">Akun</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Administrator Aktif
            </div>
            <div className="text-xl font-black text-purple-800">
              {adminCount} <span className="text-xs font-normal text-slate-400">Admin</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Teknisi & Keuangan
            </div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-0.5">
              <span className="text-[#0B4EA2]">{techCount} Teknisi</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700">{financeCount} Keuangan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-slate-50/50"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white cursor-pointer"
          >
            <option value="ALL">Semua Role</option>
            <option value={UserRole.ADMIN}>ADMIN</option>
            <option value={UserRole.TECHNICIAN}>TECHNICIAN</option>
            <option value={UserRole.FINANCE}>FINANCE</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Status Aktif</option>
            <option value="INACTIVE">Status Nonaktif</option>
          </select>

          {/* Add User Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-3 text-center w-12">#</th>
                <th className="py-3.5 px-4">Pengguna & Kontak</th>
                <th className="py-3.5 px-4">Username Login</th>
                <th className="py-3.5 px-4">Hak Akses (Role)</th>
                <th className="py-3.5 px-4 text-center">Status Akun</th>
                <th className="py-3.5 px-4">Terdaftar</th>
                <th className="py-3.5 px-4 text-center w-40">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Tidak ada data pengguna yang cocok.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const roleBadge = getRoleBadge(user.role);
                  const RoleIcon = roleBadge.icon;
                  const isCurrentAuthUser = user.id === currentUserId;

                  return (
                    <tr key={user.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* # */}
                      <td className="py-3.5 px-3 text-center font-semibold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Pengguna & Kontak */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B4EA2] to-[#1E69DE] text-white flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#072255] text-sm flex items-center gap-2">
                              <span>{user.name}</span>
                              {isCurrentAuthUser && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-[#0B4EA2] font-semibold border border-blue-200">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                              {user.email ? (
                                <>
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{user.email}</span>
                                </>
                              ) : (
                                <span className="text-slate-400 italic">Tanpa email</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          @{user.username}
                        </span>
                      </td>

                      {/* Hak Akses */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg font-bold border ${roleBadge.style}`}
                        >
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span>{roleBadge.label}</span>
                        </span>
                      </td>

                      {/* Status Akun & Switch Toggle */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={user.isActive}
                            disabled={togglingId === user.id}
                            onClick={() => handleToggleStatus(user)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              user.isActive
                                ? "bg-emerald-500 hover:bg-emerald-600"
                                : "bg-slate-300 hover:bg-slate-400"
                            } ${togglingId === user.id ? "opacity-50 cursor-wait" : ""}`}
                            title={
                              user.isActive
                                ? "Status: AKTIF (Klik untuk nonaktifkan)"
                                : "Status: NONAKTIF (Klik untuk aktifkan)"
                            }
                          >
                            <span className="sr-only">Toggle Status</span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                user.isActive ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>

                          <span
                            className={`text-[11px] font-bold ${
                              user.isActive ? "text-emerald-700" : "text-slate-400"
                            }`}
                          >
                            {user.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </td>

                      {/* Terdaftar */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {formatDateIndo(user.createdAt)}
                      </td>

                      {/* Aksi: Edit & Hapus */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => setEditingUser(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                            title="Edit Data Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            disabled={isCurrentAuthUser}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              isCurrentAuthUser
                                ? "text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed opacity-50"
                                : "text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                            }`}
                            title={
                              isCurrentAuthUser
                                ? "Tidak dapat menghapus akun sendiri"
                                : "Hapus Pengguna"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Confirm Dialog Card */}
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
