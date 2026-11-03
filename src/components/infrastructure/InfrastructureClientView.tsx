"use client";

import { useState } from "react";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import {
  returnDeviceToStock,
  toggleDeviceActiveStatus,
  deleteInventoryDevice,
  deleteOltDevice,
  deleteOdpNode,
  deleteRouterDevice,
  deleteIspProvider,
} from "@/actions/infrastructure-actions";
import OdpPortVisualizer from "./OdpPortVisualizer";
import AddOltModal from "./AddOltModal";
import EditOltModal from "./EditOltModal";
import OltDetailModal from "./OltDetailModal";
import AddOdpModal from "./AddOdpModal";
import EditOdpModal from "./EditOdpModal";
import OdpDetailModal from "./OdpDetailModal";
import AddRouterModal from "./AddRouterModal";
import EditRouterModal from "./EditRouterModal";
import RouterDetailModal from "./RouterDetailModal";
import AddIspModal from "./AddIspModal";
import EditIspModal from "./EditIspModal";
import IspDetailModal from "./IspDetailModal";
import AddDeviceModal from "./AddDeviceModal";
import EditDeviceModal from "./EditDeviceModal";
import DeviceDetailModal from "./DeviceDetailModal";
import ConfirmDialog, { ConfirmVariant } from "@/components/ui/ConfirmDialog";
import {
  Network,
  Radio,
  Server,
  HardDrive,
  Globe,
  MapPin,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  Users,
  Wifi,
  Eye,
  Edit2,
  Power,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DeviceCategory, DeviceStatus } from "@prisma/client";

interface InfrastructureClientViewProps {
  routers?: any[];
  isps?: any[];
  olts: any[];
  odps: any[];
  devices: any[];
}

export default function InfrastructureClientView({
  routers = [],
  isps = [],
  olts,
  odps,
  devices,
}: InfrastructureClientViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ODP" | "OLT" | "ROUTERS" | "ISPS" | "DEVICES">("ODP");

  // Filter states for inventory
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceCategoryFilter, setDeviceCategoryFilter] = useState<string>("ALL");
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<string>("ALL");

  // Modals & Action States
  const [showAddRouter, setShowAddRouter] = useState(false);
  const [showAddIsp, setShowAddIsp] = useState(false);
  const [showAddOlt, setShowAddOlt] = useState(false);
  const [showAddOdp, setShowAddOdp] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);

  const [selectedRouterForDetail, setSelectedRouterForDetail] = useState<any | null>(null);
  const [selectedRouterForEdit, setSelectedRouterForEdit] = useState<any | null>(null);
  const [selectedIspForDetail, setSelectedIspForDetail] = useState<any | null>(null);
  const [selectedIspForEdit, setSelectedIspForEdit] = useState<any | null>(null);
  const [selectedDeviceForDetail, setSelectedDeviceForDetail] = useState<any | null>(null);
  const [selectedDeviceForEdit, setSelectedDeviceForEdit] = useState<any | null>(null);
  const [selectedOltForDetail, setSelectedOltForDetail] = useState<any | null>(null);
  const [selectedOltForEdit, setSelectedOltForEdit] = useState<any | null>(null);
  const [selectedOdpForDetail, setSelectedOdpForDetail] = useState<any | null>(null);
  const [selectedOdpForEdit, setSelectedOdpForEdit] = useState<any | null>(null);

  const [togglingActiveId, setTogglingActiveId] = useState<string | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [deletingRouterId, setDeletingRouterId] = useState<string | null>(null);
  const [deletingIspId, setDeletingIspId] = useState<string | null>(null);
  const [deletingOltId, setDeletingOltId] = useState<string | null>(null);
  const [deletingOdpId, setDeletingOdpId] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);

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

  const handleRefresh = () => {
    router.refresh();
  };

  const handleReturnToStock = (deviceId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Tarik Perangkat ke Gudang",
      description:
        "Perangkat ini akan diputuskan dari pelanggan/warung yang terhubung dan statusnya dikembalikan menjadi IN_STOCK (Ready di Gudang). Lanjutkan?",
      confirmText: "Tarik ke Gudang",
      variant: "primary",
      action: async () => {
        try {
          setReturningId(deviceId);
          await returnDeviceToStock(deviceId);
          handleRefresh();
        } finally {
          setReturningId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleToggleActive = (
    deviceId: string,
    deviceName: string,
    currentStatus: DeviceStatus
  ) => {
    const isInactive = currentStatus === DeviceStatus.INACTIVE;
    setConfirmDialog({
      isOpen: true,
      title: isInactive ? "Aktifkan Perangkat" : "Non Aktifkan Perangkat",
      description: isInactive
        ? `Aktifkan kembali perangkat "${deviceName}" ke status IN_STOCK (Ready di Gudang)?`
        : `Non aktifkan perangkat "${deviceName}"? Status perangkat akan diubah menjadi NON AKTIF dan dilepas dari pelanggan jika sedang terpasang.`,
      confirmText: isInactive ? "Aktifkan" : "Non Aktifkan",
      variant: isInactive ? "success" : "warning",
      action: async () => {
        try {
          setTogglingActiveId(deviceId);
          await toggleDeviceActiveStatus(deviceId);
          handleRefresh();
        } finally {
          setTogglingActiveId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteDevice = (
    deviceId: string,
    serialNumber: string,
    brandModel: string
  ) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Perangkat Permanen",
      description: `Apakah Anda yakin ingin menghapus perangkat "${brandModel}" (SN: ${serialNumber}) dari inventaris secara permanen? Data yang telah dihapus tidak dapat dipulihkan.`,
      confirmText: "Hapus Permanen",
      variant: "danger",
      action: async () => {
        try {
          setDeletingDeviceId(deviceId);
          await deleteInventoryDevice(deviceId);
          handleRefresh();
        } finally {
          setDeletingDeviceId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteOlt = (oltId: string, oltName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Master OLT",
      description: `Apakah Anda yakin ingin menghapus "${oltName}" dari master OLT? Seluruh tiang ODP yang tertaut ke OLT ini tidak akan ikut terhapus, melainkan status koneksinya akan diubah menjadi standalone/direct.`,
      confirmText: "Hapus OLT",
      variant: "danger",
      action: async () => {
        try {
          setDeletingOltId(oltId);
          await deleteOltDevice(oltId);
          handleRefresh();
        } finally {
          setDeletingOltId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteOdp = (odpId: string, odpCode: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Master ODP",
      description: `Apakah Anda yakin ingin menghapus tiang ODP "${odpCode}"? Pelanggan dan hotspot yang tertaut ke port ODP ini akan dilepas (status port direset) tanpa ikut terhapus.`,
      confirmText: "Hapus ODP",
      variant: "danger",
      action: async () => {
        try {
          setDeletingOdpId(odpId);
          await deleteOdpNode(odpId);
          handleRefresh();
        } finally {
          setDeletingOdpId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteRouter = (routerId: string, routerName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Router MikroTik",
      description: `Apakah Anda yakin ingin menghapus "${routerName}"? OLT dan ISP yang terhubung ke router ini akan dialihkan menjadi standalone tanpa ikut terhapus.`,
      confirmText: "Hapus Router",
      variant: "danger",
      action: async () => {
        try {
          setDeletingRouterId(routerId);
          await deleteRouterDevice(routerId);
          handleRefresh();
        } finally {
          setDeletingRouterId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteIsp = (ispId: string, ispName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Provider ISP",
      description: `Apakah Anda yakin ingin menghapus provider "${ispName}" dari data upstream?`,
      confirmText: "Hapus ISP",
      variant: "danger",
      action: async () => {
        try {
          setDeletingIspId(ispId);
          await deleteIspProvider(ispId);
          handleRefresh();
        } finally {
          setDeletingIspId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Filtered devices
  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.serialNumber.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.brandModel.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      (d.macAddress && d.macAddress.toLowerCase().includes(deviceSearch.toLowerCase())) ||
      (d.homeCustomer && d.homeCustomer.name.toLowerCase().includes(deviceSearch.toLowerCase())) ||
      (d.hotspotPartner && d.hotspotPartner.name.toLowerCase().includes(deviceSearch.toLowerCase())) ||
      (d.oltDevice && d.oltDevice.name.toLowerCase().includes(deviceSearch.toLowerCase())) ||
      (d.odpNode && d.odpNode.code.toLowerCase().includes(deviceSearch.toLowerCase())) ||
      (d.routerDevice && d.routerDevice.name.toLowerCase().includes(deviceSearch.toLowerCase()));

    const matchesCategory =
      deviceCategoryFilter === "ALL" || d.category === deviceCategoryFilter;
    const matchesStatus =
      deviceStatusFilter === "ALL" || d.status === deviceStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate ODP ports summary
  const totalPortsAll = odps.reduce((s, o) => s + (o.splitterCapacity || 8), 0);
  const totalOccupiedPortsAll = odps.reduce((s, o) => s + (o.occupiedCount || 0), 0);
  const totalFreePortsAll = totalPortsAll - totalOccupiedPortsAll;

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab("ODP")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "ODP"
                ? "bg-white text-[#072255] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Radio className="w-4 h-4 text-[#0B4EA2]" />
            <span>Master ODP & Port Visualizer ({odps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("OLT")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "OLT"
                ? "bg-white text-[#072255] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Server className="w-4 h-4 text-[#0B4EA2]" />
            <span>Master OLT ({olts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ROUTERS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "ROUTERS"
                ? "bg-white text-[#072255] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Network className="w-4 h-4 text-[#0B4EA2]" />
            <span>Router & POP ({routers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ISPS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "ISPS"
                ? "bg-white text-[#072255] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Provider ISP ({isps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("DEVICES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "DEVICES"
                ? "bg-white text-[#072255] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <HardDrive className="w-4 h-4 text-[#0B4EA2]" />
            <span>Inventaris Gudang ({devices.length})</span>
          </button>
        </div>

        {/* Tab specific action buttons */}
        <div className="flex items-center gap-2 px-2">
          {activeTab === "ODP" && (
            <button
              onClick={() => setShowAddOdp(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah ODP</span>
            </button>
          )}

          {activeTab === "OLT" && (
            <button
              onClick={() => setShowAddOlt(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah OLT</span>
            </button>
          )}

          {activeTab === "ROUTERS" && (
            <button
              onClick={() => setShowAddRouter(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Router / POP</span>
            </button>
          )}

          {activeTab === "ISPS" && (
            <button
              onClick={() => setShowAddIsp(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Provider ISP</span>
            </button>
          )}

          {activeTab === "DEVICES" && (
            <button
              onClick={() => setShowAddDevice(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Input Perangkat Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ODP PORT VISUALIZER */}
      {activeTab === "ODP" && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Total Tiang ODP</div>
                <div className="text-xl font-black text-[#072255]">{odps.length} Titik</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Port Terpakai</div>
                <div className="text-xl font-black text-purple-800">
                  {totalOccupiedPortsAll} / {totalPortsAll} Port
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Sisa Port Tersedia (Bebas)</div>
                <div className="text-xl font-black text-emerald-700">{totalFreePortsAll} Port</div>
              </div>
            </div>
          </div>

          {/* ODP Cards */}
          <div className="space-y-4">
            {odps.map((odp) => (
              <OdpPortVisualizer
                key={odp.id}
                odp={odp}
                onView={() => setSelectedOdpForDetail(odp)}
                onEdit={() => setSelectedOdpForEdit(odp)}
                onDelete={() => handleDeleteOdp(odp.id, odp.code)}
                isDeleting={deletingOdpId === odp.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MASTER OLT */}
      {activeTab === "OLT" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {olts.map((olt) => (
              <div
                key={olt.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#072255]">{olt.name}</h4>
                      <p className="text-xs text-slate-500">{olt.brandModel}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0B4EA2] border border-blue-200">
                      {olt.ponPortsCount} Port PON
                    </span>
                    {olt.devices && olt.devices.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-mono font-bold border border-purple-200" title={`SN Gudang: ${olt.devices[0].serialNumber}`}>
                        SN: {olt.devices[0].serialNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">IP Lokal Manajemen:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {olt.localIp || "Tidak diset"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Router / POP Site:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Network className="w-3.5 h-3.5 text-[#0B4EA2]" />
                      {olt.router ? `${olt.router.name}` : olt.location}
                    </span>
                  </div>
                </div>

                {olt.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {olt.notes}
                  </p>
                )}

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">
                    ODP Terhubung: <strong className="text-slate-800">{olt.odpNodes?.length || 0} Tiang</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* 1. Lihat / Detail Button */}
                    <button
                      onClick={() => setSelectedOltForDetail(olt)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0B4EA2] hover:bg-blue-50 border border-slate-200 transition-colors shadow-2xs"
                      title="Lihat Detail OLT"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0B4EA2]" />
                      <span>Lihat</span>
                    </button>

                    {/* 2. Edit Button */}
                    <button
                      onClick={() => setSelectedOltForEdit(olt)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors shadow-2xs"
                      title="Edit Data OLT"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit</span>
                    </button>

                    {/* 3. Delete Button */}
                    <button
                      onClick={() => handleDeleteOlt(olt.id, olt.name)}
                      disabled={deletingOltId === olt.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
                      title="Hapus Master OLT"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ROUTER & POP */}
      {activeTab === "ROUTERS" && (
        <div className="space-y-4">
          {routers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center mx-auto">
                <Network className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#072255]">Belum Ada Router MikroTik / POP</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tambahkan router MikroTik gateway utama (NOC) maupun router titik distribusi (POP) di berbagai lokasi untuk mengelola jaringan multi-site.
              </p>
              <button
                onClick={() => setShowAddRouter(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Router Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routers.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center">
                        <Network className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-base font-bold text-[#072255]">{r.name}</h4>
                          {r.isCoreGateway && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              CORE NOC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{r.brandModel}</p>
                      </div>
                    </div>
                    {r.devices && r.devices.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-mono font-bold border border-purple-200" title={`SN Gudang: ${r.devices[0].serialNumber}`}>
                        SN: {r.devices[0].serialNumber}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">IP Gateway:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {r.ipAddress || "Tidak diset"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Lokasi / POP Site:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0B4EA2]" />
                        {r.siteLocation}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>ISP Upstream: <strong className="text-slate-800">{r.ispProviders?.length || 0} Link</strong></span>
                    <span>OLT Terhubung: <strong className="text-slate-800">{r.oltDevices?.length || 0} Unit</strong></span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5 text-xs">
                    <button
                      onClick={() => setSelectedRouterForDetail(r)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0B4EA2] hover:bg-blue-50 border border-slate-200 transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0B4EA2]" />
                      <span>Lihat</span>
                    </button>
                    <button
                      onClick={() => setSelectedRouterForEdit(r)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRouter(r.id, r.name)}
                      disabled={deletingRouterId === r.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: PROVIDER ISP */}
      {activeTab === "ISPS" && (
        <div className="space-y-4">
          {isps.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#072255]">Belum Ada Provider ISP</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Daftarkan penyedia bandwidth upstream (Telkom, Indosat, Moratel, Icon+, dll.) beserta kapasitas Mbps dan router tujuan.
              </p>
              <button
                onClick={() => setShowAddIsp(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah ISP Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isps.map((isp) => (
                <div
                  key={isp.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#072255]">{isp.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold">{isp.serviceType}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {isp.bandwidthMbps} Mbps
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        isp.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {isp.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Router Gateway:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Network className="w-3.5 h-3.5 text-[#0B4EA2]" />
                        {isp.router ? `${isp.router.name}` : "Standalone"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Biaya Langganan:</span>
                      <span className="font-bold text-slate-900">
                        {isp.monthlyCost ? formatRupiah(isp.monthlyCost) : "Gratis / Peering"}
                      </span>
                    </div>
                  </div>

                  {isp.circuitId && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl font-mono border border-slate-100">
                      CID: <strong>{isp.circuitId}</strong>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5 text-xs">
                    <button
                      onClick={() => setSelectedIspForDetail(isp)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0B4EA2] hover:bg-blue-50 border border-slate-200 transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0B4EA2]" />
                      <span>Lihat</span>
                    </button>
                    <button
                      onClick={() => setSelectedIspForEdit(isp)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteIsp(isp.id, isp.name)}
                      disabled={deletingIspId === isp.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVENTORY DEVICES */}
      {activeTab === "DEVICES" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Serial Number, model, MAC, nama pemakai..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={deviceCategoryFilter}
                onChange={(e) => setDeviceCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
              >
                <option value="ALL">Semua Kategori</option>
                <option value={DeviceCategory.OLT}>Master OLT</option>
                <option value={DeviceCategory.ODP}>Kotak ODP</option>
                <option value={DeviceCategory.ONT}>ONT / Modem</option>
                <option value={DeviceCategory.AP_OUTDOOR}>AP Outdoor</option>
                <option value={DeviceCategory.ROUTER}>Router</option>
                <option value={DeviceCategory.SWITCH}>Switch Hub</option>
                <option value={DeviceCategory.CONVERTER}>Converter HTB</option>
              </select>

              <select
                value={deviceStatusFilter}
                onChange={(e) => setDeviceStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
              >
                <option value="ALL">Semua Status</option>
                <option value={DeviceStatus.IN_STOCK}>IN_STOCK (Gudang)</option>
                <option value={DeviceStatus.DEPLOYED_INFRA}>DEPLOYED_INFRA (OLT/ODP)</option>
                <option value={DeviceStatus.DEPLOYED_HOME}>DEPLOYED_HOME (Rumah)</option>
                <option value={DeviceStatus.DEPLOYED_HOTSPOT}>DEPLOYED_HOTSPOT (Warung)</option>
                <option value={DeviceStatus.BROKEN}>BROKEN (Rusak)</option>
                <option value={DeviceStatus.INACTIVE}>INACTIVE (Non Aktif)</option>
              </select>
            </div>
          </div>

          {/* Device Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Kategori & Model</th>
                    <th className="py-3 px-4">Serial Number / MAC</th>
                    <th className="py-3 px-4">Status & Penempatan</th>
                    <th className="py-3 px-4">Tgl Beli & Harga</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Tidak ada perangkat inventaris yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map((dev) => (
                      <tr key={dev.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{dev.brandModel}</span>
                          <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 w-fit inline-block mt-0.5">
                            {dev.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <span className="font-bold text-[#0B4EA2] block">
                            {dev.serialNumber}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            MAC: {dev.macAddress || "-"}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                dev.status === DeviceStatus.IN_STOCK
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : dev.status === DeviceStatus.DEPLOYED_INFRA
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : dev.status === DeviceStatus.DEPLOYED_HOME
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : dev.status === DeviceStatus.DEPLOYED_HOTSPOT
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : dev.status === DeviceStatus.INACTIVE
                                  ? "bg-slate-200 text-slate-700 border border-slate-300"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {dev.status === DeviceStatus.INACTIVE ? "NON AKTIF" : dev.status}
                            </span>
                          </div>

                          {dev.homeCustomer && (
                            <span className="text-[11px] text-slate-600 flex items-center gap-1">
                              <Users className="w-3 h-3 text-[#0B4EA2]" />
                              {dev.homeCustomer.name}
                            </span>
                          )}

                          {dev.hotspotPartner && (
                            <span className="text-[11px] text-slate-600 flex items-center gap-1">
                              <Wifi className="w-3 h-3 text-amber-600" />
                              {dev.hotspotPartner.name}
                            </span>
                          )}

                          {dev.oltDevice && (
                            <span className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                              <Server className="w-3 h-3 text-purple-600" />
                              OLT: {dev.oltDevice.name}
                            </span>
                          )}

                          {dev.odpNode && (
                            <span className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                              <Radio className="w-3 h-3 text-indigo-600" />
                              ODP: {dev.odpNode.code}
                            </span>
                          )}

                          {dev.routerDevice && (
                            <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                              <Network className="w-3 h-3 text-[#0B4EA2]" />
                              Router: {dev.routerDevice.name}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-500">
                          <div>{dev.purchaseDate ? formatDateIndo(dev.purchaseDate) : "-"}</div>
                          <div className="font-semibold text-slate-700 text-[11px]">
                            {dev.purchasePrice ? formatRupiah(dev.purchasePrice) : "-"}
                          </div>
                        </td>

                        {/* Updated Actions Column: Detail, Edit, Non Aktif, Delete */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* 1. Detail */}
                            <button
                              onClick={() => setSelectedDeviceForDetail(dev)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-[#0B4EA2] hover:bg-blue-50 border border-slate-200 transition-colors shadow-2xs"
                              title="Detail Perangkat"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. Edit */}
                            <button
                              onClick={() => setSelectedDeviceForEdit(dev)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors shadow-2xs"
                              title="Edit Perangkat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* 3. Non Aktif / Aktif Toggle */}
                            <button
                              onClick={() =>
                                handleToggleActive(dev.id, dev.brandModel, dev.status)
                              }
                              disabled={togglingActiveId === dev.id}
                              className={`p-1.5 rounded-lg border transition-colors shadow-2xs ${
                                dev.status === DeviceStatus.INACTIVE
                                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 font-bold"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
                              }`}
                              title={
                                dev.status === DeviceStatus.INACTIVE
                                  ? "Aktifkan Perangkat (Ready Gudang)"
                                  : "Non Aktifkan Perangkat"
                              }
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            {/* 4. Delete */}
                            <button
                              onClick={() =>
                                handleDeleteDevice(dev.id, dev.serialNumber, dev.brandModel)
                              }
                              disabled={deletingDeviceId === dev.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shadow-2xs"
                              title="Hapus Perangkat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddRouter && (
        <AddRouterModal
          availableDevices={devices}
          onClose={() => setShowAddRouter(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showAddIsp && (
        <AddIspModal
          routers={routers}
          onClose={() => setShowAddIsp(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showAddOlt && (
        <AddOltModal
          availableDevices={devices}
          routers={routers}
          onClose={() => setShowAddOlt(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showAddOdp && (
        <AddOdpModal
          olts={olts}
          availableDevices={devices}
          onClose={() => setShowAddOdp(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showAddDevice && (
        <AddDeviceModal
          onClose={() => setShowAddDevice(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Router Detail & Edit Modals */}
      {selectedRouterForDetail && (
        <RouterDetailModal
          router={selectedRouterForDetail}
          onClose={() => setSelectedRouterForDetail(null)}
          onEdit={() => setSelectedRouterForEdit(selectedRouterForDetail)}
          onDelete={() =>
            handleDeleteRouter(selectedRouterForDetail.id, selectedRouterForDetail.name)
          }
        />
      )}

      {selectedRouterForEdit && (
        <EditRouterModal
          router={selectedRouterForEdit}
          onClose={() => setSelectedRouterForEdit(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* ISP Detail & Edit Modals */}
      {selectedIspForDetail && (
        <IspDetailModal
          isp={selectedIspForDetail}
          onClose={() => setSelectedIspForDetail(null)}
          onEdit={() => setSelectedIspForEdit(selectedIspForDetail)}
          onDelete={() =>
            handleDeleteIsp(selectedIspForDetail.id, selectedIspForDetail.name)
          }
        />
      )}

      {selectedIspForEdit && (
        <EditIspModal
          isp={selectedIspForEdit}
          routers={routers}
          onClose={() => setSelectedIspForEdit(null)}
          onSuccess={handleRefresh}
        />
      )}

      {selectedDeviceForDetail && (
        <DeviceDetailModal
          device={selectedDeviceForDetail}
          onClose={() => setSelectedDeviceForDetail(null)}
          onEdit={() => setSelectedDeviceForEdit(selectedDeviceForDetail)}
          onToggleActive={() =>
            handleToggleActive(
              selectedDeviceForDetail.id,
              selectedDeviceForDetail.brandModel,
              selectedDeviceForDetail.status
            )
          }
          onDelete={() =>
            handleDeleteDevice(
              selectedDeviceForDetail.id,
              selectedDeviceForDetail.serialNumber,
              selectedDeviceForDetail.brandModel
            )
          }
        />
      )}

      {selectedDeviceForEdit && (
        <EditDeviceModal
          device={selectedDeviceForEdit}
          onClose={() => setSelectedDeviceForEdit(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* OLT Detail & Edit Modals */}
      {selectedOltForDetail && (
        <OltDetailModal
          olt={selectedOltForDetail}
          onClose={() => setSelectedOltForDetail(null)}
          onEdit={() => setSelectedOltForEdit(selectedOltForDetail)}
          onDelete={() => handleDeleteOlt(selectedOltForDetail.id, selectedOltForDetail.name)}
        />
      )}

      {selectedOltForEdit && (
        <EditOltModal
          olt={selectedOltForEdit}
          routers={routers}
          onClose={() => setSelectedOltForEdit(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* ODP Detail & Edit Modals */}
      {selectedOdpForDetail && (
        <OdpDetailModal
          odp={selectedOdpForDetail}
          onClose={() => setSelectedOdpForDetail(null)}
          onEdit={() => setSelectedOdpForEdit(selectedOdpForDetail)}
          onDelete={() => handleDeleteOdp(selectedOdpForDetail.id, selectedOdpForDetail.code)}
        />
      )}

      {selectedOdpForEdit && (
        <EditOdpModal
          odp={selectedOdpForEdit}
          olts={olts}
          onClose={() => setSelectedOdpForEdit(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Custom Confirmation Modal Card */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={Boolean(
          returningId ||
            togglingActiveId ||
            deletingDeviceId ||
            deletingRouterId ||
            deletingIspId ||
            deletingOltId ||
            deletingOdpId
        )}
        onConfirm={() => confirmDialog.action && confirmDialog.action()}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
