"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Workflow,
  Server,
  Network,
  Users,
  Wifi,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Activity,
  HardDrive,
  Radio,
  Printer,
  Maximize2,
  Minimize2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ExternalLink,
  Phone,
} from "lucide-react";
import TopologyDetailModal, {
  TopologySelectedNode,
} from "./TopologyDetailModal";
import CiscoPacketTracerCanvas from "./CiscoPacketTracerCanvas";
import { TopologySummary } from "@/actions/topology-actions";

interface TopologyClientViewProps {
  initialData: {
    routers?: any[];
    isps?: any[];
    olts: any[];
    unassignedOdps: any[];
    unassignedCustomers: any[];
    unassignedPartners: any[];
    summary: TopologySummary;
  };
}

export default function TopologyClientView({
  initialData,
}: TopologyClientViewProps) {
  const { olts, unassignedOdps, unassignedCustomers, unassignedPartners, summary } =
    initialData;

  // View mode: TREE (Hierarchical Diagram), GRID (Port Matrix), TABLE (Route List)
  const [viewMode, setViewMode] = useState<"TREE" | "GRID" | "TABLE">("TREE");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOltFilter, setSelectedOltFilter] = useState<string>("ALL");
  const [endpointTypeFilter, setEndpointTypeFilter] = useState<"ALL" | "CUSTOMER" | "PARTNER" | "EMPTY">("ALL");

  // Node detail modal
  const [selectedNodeForDetail, setSelectedNodeForDetail] =
    useState<TopologySelectedNode | null>(null);

  // Fullscreen / print view
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filtered OLTs according to selector and search query
  const filteredOlts = useMemo(() => {
    return olts.filter((olt) => {
      if (selectedOltFilter !== "ALL" && olt.id !== selectedOltFilter) {
        return false;
      }
      return true;
    });
  }, [olts, selectedOltFilter]);

  // Signal color helper
  const getSignalBadge = (dbm: number | null | undefined) => {
    if (dbm === null || dbm === undefined) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
          - dBm
        </span>
      );
    }
    if (dbm >= -20) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {dbm} dBm
        </span>
      );
    }
    if (dbm >= -24) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          {dbm} dBm
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        {dbm} dBm
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-[#F8FAFC] p-6 overflow-y-auto" : ""}`}>
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#072255] tracking-tight flex items-center gap-2">
            <Workflow className="w-6 h-6 text-[#0B4EA2]" />
            <span>Topologi Jaringan FTTH & Hotspot</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Peta visual alur kabel fiber optik dari Core Router & OLT menuju tiang ODP dan pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Cetak Topologi (Print / PDF)"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Cetak Diagram</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh (NOC Display)"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-[#0B4EA2]" />
                <span className="hidden sm:inline">Normal</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-[#0B4EA2]" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total OLT */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Master OLT</span>
            <HardDrive className="w-4 h-4 text-[#0B4EA2]" />
          </div>
          <div className="text-2xl font-black text-[#072255]">
            {summary.totalOlts}{" "}
            <span className="text-xs font-semibold text-slate-400">Unit</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <span>{summary.totalPonPorts} Total Port PON</span>
          </div>
        </div>

        {/* Total ODP */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Titik ODP</span>
            <Network className="w-4 h-4 text-[#1E69DE]" />
          </div>
          <div className="text-2xl font-black text-[#072255]">
            {summary.totalOdps}{" "}
            <span className="text-xs font-semibold text-slate-400">Box</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <span>Kapasitas {summary.totalCapacity} Port</span>
          </div>
        </div>

        {/* Okupansi Port */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Okupansi Port</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#072255]">
            {summary.occupancyRate}
            <span className="text-sm font-bold text-slate-400">%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                summary.occupancyRate > 80
                  ? "bg-rose-500"
                  : summary.occupancyRate > 60
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, summary.occupancyRate)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400">
            {summary.totalUsedPorts} dari {summary.totalCapacity} port terisi
          </div>
        </div>

        {/* Klien Rumahan & Hotspot */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Klien Terhubung</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-[#072255]">
            {summary.totalCustomers + summary.totalPartners}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span className="text-blue-700 font-semibold">{summary.totalCustomers} Rumahan</span>
            <span>•</span>
            <span className="text-indigo-700 font-semibold">{summary.totalPartners} Mitra</span>
          </div>
        </div>

        {/* Redaman ODP Rata-rata */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Rata-rata Redaman</span>
            <Radio className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#072255]">
            {summary.avgOdpSignal !== null ? `${summary.avgOdpSignal}` : "-"}
            <span className="text-xs font-semibold text-slate-400 ml-1">dBm</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            {summary.avgOdpSignal !== null && summary.avgOdpSignal >= -20 ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Kualitas Sangat Baik
              </span>
            ) : summary.avgOdpSignal !== null && summary.avgOdpSignal >= -24 ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Perlu Pemantauan
              </span>
            ) : (
              <span className="text-slate-400">Belum ada redaman</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Filter & View Mode Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("TREE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "TREE"
                  ? "bg-white text-[#0B4EA2] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Tapak Tracer</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "GRID"
                  ? "bg-white text-[#0B4EA2] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matriks Port ODP</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "TABLE"
                  ? "bg-white text-[#0B4EA2] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Tabel Rute Sinyal</span>
            </button>
          </div>

          {/* OLT Selector & Quick Expand/Collapse */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedOltFilter}
              onChange={(e) => setSelectedOltFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            >
              <option value="ALL">Semua OLT ({olts.length})</option>
              {olts.map((olt) => (
                <option key={olt.id} value={olt.id}>
                  {olt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar & Endpoint Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama ODP, pelanggan rumahan, nama warung mitra, atau redaman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setEndpointTypeFilter("ALL")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                endpointTypeFilter === "ALL"
                  ? "bg-[#0B4EA2] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setEndpointTypeFilter("CUSTOMER")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                endpointTypeFilter === "CUSTOMER"
                  ? "bg-[#0B4EA2] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Rumahan
            </button>
            <button
              type="button"
              onClick={() => setEndpointTypeFilter("PARTNER")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                endpointTypeFilter === "PARTNER"
                  ? "bg-[#0B4EA2] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Mitra Hotspot
            </button>
            <button
              type="button"
              onClick={() => setEndpointTypeFilter("EMPTY")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                endpointTypeFilter === "EMPTY"
                  ? "bg-[#0B4EA2] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Port Kosong
            </button>
          </div>
        </div>
      </div>

      {/* 3. VIEW 1: CISCO PACKET TRACER TOPOLOGY CANVAS */}
      {viewMode === "TREE" && (
        <CiscoPacketTracerCanvas
          routers={initialData.routers || []}
          isps={initialData.isps || []}
          olts={filteredOlts}
          unassignedOdps={unassignedOdps}
          unassignedCustomers={unassignedCustomers}
          unassignedPartners={unassignedPartners}
          onSelectNode={(node) => setSelectedNodeForDetail(node)}
        />
      )}

      {/* 4. VIEW 2: PORT MATRIX GRID */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {olts.map((olt) =>
            olt.odpNodes.map((odp: any) => {
              const allConnected = [
                ...odp.homeCustomers.map((c: any) => ({
                  ...c,
                  _clientType: "CUSTOMER",
                })),
                ...odp.hotspotPartners.map((p: any) => ({
                  ...p,
                  _clientType: "PARTNER",
                })),
              ];

              const portMap: Record<number, any> = {};
              for (const c of allConnected) {
                if (c.odpPort) {
                  portMap[c.odpPort] = c;
                }
              }

              return (
                <div
                  key={odp.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-[#072255]">
                          {odp.code}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                          PON {odp.ponPortNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {olt.name} • Splitter 1:{odp.splitterCapacity}
                      </p>
                    </div>
                    {getSignalBadge(odp.opticalPowerDbm)}
                  </div>

                  {/* Port Sockets Grid */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Daftar Port Splitter (1 - {odp.splitterCapacity}):
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: odp.splitterCapacity }).map((_, idx) => {
                        const portNum = idx + 1;
                        const client = portMap[portNum];

                        return (
                          <div
                            key={portNum}
                            onClick={() => {
                              if (client) {
                                setSelectedNodeForDetail({
                                  type: client._clientType,
                                  data: client,
                                  parentInfo: {
                                    oltName: olt.name,
                                    ponPort: odp.ponPortNumber,
                                    odpCode: odp.code,
                                    portNumber: portNum,
                                  },
                                });
                              }
                            }}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              client
                                ? "bg-blue-50 border-blue-200 hover:bg-blue-100/80 cursor-pointer shadow-3xs"
                                : "bg-slate-50 border-slate-200/60 text-slate-400"
                            }`}
                          >
                            <div className="text-[10px] font-bold text-slate-500">
                              Port {portNum}
                            </div>
                            <div
                              className={`text-[11px] font-extrabold truncate mt-0.5 ${
                                client ? "text-[#072255]" : "text-slate-400"
                              }`}
                            >
                              {client ? client.name.split(" ")[0] : "Kosong"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {allConnected.length} / {odp.splitterCapacity} Port Terisi
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedNodeForDetail({
                          type: "ODP",
                          data: odp,
                          parentInfo: { oltName: olt.name, ponPort: odp.ponPortNumber },
                        })
                      }
                      className="text-[#0B4EA2] hover:underline font-bold text-xs"
                    >
                      Detail ODP →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. VIEW 3: SIGNAL ROUTING TABLE */}
      {viewMode === "TABLE" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Klien / Titik</th>
                  <th className="px-4 py-3.5">Tipe</th>
                  <th className="px-4 py-3.5">Master OLT</th>
                  <th className="px-4 py-3.5">PON Port</th>
                  <th className="px-4 py-3.5">Box ODP</th>
                  <th className="px-4 py-3.5">Port ODP</th>
                  <th className="px-4 py-3.5">Redaman</th>
                  <th className="px-4 py-3.5">Kontak</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {olts.flatMap((olt) =>
                  olt.odpNodes.flatMap((odp: any) => {
                    const allConnected = [
                      ...odp.homeCustomers.map((c: any) => ({
                        ...c,
                        _clientType: "CUSTOMER",
                      })),
                      ...odp.hotspotPartners.map((p: any) => ({
                        ...p,
                        _clientType: "PARTNER",
                      })),
                    ];

                    return allConnected.map((client: any) => (
                      <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-[#072255]">
                          <div>{client.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {client._clientType === "CUSTOMER"
                              ? client.packageName
                              : client.ownerName}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              client._clientType === "CUSTOMER"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}
                          >
                            {client._clientType === "CUSTOMER" ? "Rumahan" : "Hotspot"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">{olt.name}</td>
                        <td className="px-4 py-3.5 font-mono font-bold text-[#0B4EA2]">
                          PON {odp.ponPortNumber}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          {odp.code}
                        </td>
                        <td className="px-4 py-3.5 font-bold font-mono text-[#072255]">
                          Port {client.odpPort || "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          {getSignalBadge(
                            client._clientType === "CUSTOMER"
                              ? client.signalDbm
                              : odp.opticalPowerDbm
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">
                          {client.phone}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedNodeForDetail({
                                type: client._clientType,
                                data: client,
                                parentInfo: {
                                  oltName: olt.name,
                                  ponPort: odp.ponPortNumber,
                                  odpCode: odp.code,
                                  portNumber: client.odpPort,
                                },
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0B4EA2] font-bold text-xs cursor-pointer"
                          >
                            Lihat Jalur
                          </button>
                        </td>
                      </tr>
                    ));
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Node Detail Modal */}
      <TopologyDetailModal
        node={selectedNodeForDetail}
        onClose={() => setSelectedNodeForDetail(null)}
      />
    </div>
  );
}
