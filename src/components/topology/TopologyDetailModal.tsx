"use client";

import { X, Server, Network, User, Wifi, MapPin, Phone, Activity, HardDrive, ExternalLink, Globe } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

export type TopologyNodeType = "CORE" | "OLT" | "ODP" | "CUSTOMER" | "PARTNER" | "CLOUD";

export interface TopologySelectedNode {
  type: TopologyNodeType;
  data: any;
  parentInfo?: {
    oltName?: string;
    ponPort?: number;
    odpCode?: string;
    portNumber?: number;
  };
}

interface TopologyDetailModalProps {
  node: TopologySelectedNode | null;
  onClose: () => void;
}

export default function TopologyDetailModal({
  node,
  onClose,
}: TopologyDetailModalProps) {
  if (!node) return null;

  const { type, data, parentInfo } = node;

  const getSignalBadge = (dbm: number | null | undefined) => {
    if (dbm === null || dbm === undefined) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
          Belum Diukur
        </span>
      );
    }
    if (dbm >= -20) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {dbm} dBm (Bagus)
        </span>
      );
    }
    if (dbm >= -24) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          {dbm} dBm (Waspada)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        {dbm} dBm (Kritis)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#072255] via-[#0B4EA2] to-[#1E69DE]" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 p-2.5 flex items-center justify-center text-[#0B4EA2] flex-shrink-0 shadow-2xs">
              {type === "CORE" && <Server className="w-6 h-6" />}
              {type === "CLOUD" && <Globe className="w-6 h-6 text-emerald-600" />}
              {type === "OLT" && <HardDrive className="w-6 h-6" />}
              {type === "ODP" && <Network className="w-6 h-6" />}
              {type === "CUSTOMER" && <User className="w-6 h-6" />}
              {type === "PARTNER" && <Wifi className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {type === "CORE" && (data.siteLocation ? `Router / POP (${data.siteLocation})` : "Pusat Jaringan NOC")}
                  {type === "CLOUD" && "Provider ISP Upstream"}
                  {type === "OLT" && "Master OLT (Optical Line)"}
                  {type === "ODP" && "Titik ODP (Splitter Node)"}
                  {type === "CUSTOMER" && "Pelanggan Rumahan (FTTH)"}
                  {type === "PARTNER" && "Titik Hotspot Mitra"}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#072255] tracking-tight mt-0.5">
                {type === "CORE" && (data.name || "Core Router & Server NOC Utama")}
                {type === "CLOUD" && (data.name || "ISP Upstream Gateway")}
                {type === "OLT" && data.name}
                {type === "ODP" && data.code}
                {type === "CUSTOMER" && data.name}
                {type === "PARTNER" && data.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
          {/* Path Info */}
          {parentInfo && (
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-900 flex items-center gap-2 flex-wrap">
              <span className="font-bold">Jalur Distribusi:</span>
              <span className="font-mono">
                {parentInfo.oltName ? `${parentInfo.oltName} ` : ""}
                {parentInfo.ponPort ? `→ PON ${parentInfo.ponPort} ` : ""}
                {parentInfo.odpCode ? `→ ${parentInfo.odpCode} ` : ""}
                {parentInfo.portNumber ? `[Port ${parentInfo.portNumber}]` : ""}
              </span>
            </div>
          )}

          {/* OLT Details */}
          {type === "OLT" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Brand & Model:</span>
                <span className="font-semibold text-slate-800">{data.brandModel || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">IP Manajemen:</span>
                <span className="font-mono font-semibold text-slate-800">{data.localIp || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Jumlah Port PON:</span>
                <span className="font-semibold text-slate-800">{data.ponPortsCount} Port</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Lokasi Penempatan:</span>
                <span className="font-semibold text-slate-800">{data.location || "-"}</span>
              </div>
              {data.notes && (
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Catatan Konfigurasi:</span>
                  <span className="text-slate-700">{data.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* ODP Details */}
          {type === "ODP" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Kapasitas Splitter:</span>
                <span className="font-bold text-[#0B4EA2]">{data.splitterCapacity} Port (1:{data.splitterCapacity})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Redaman ODP (dBm):</span>
                <div className="mt-0.5">{getSignalBadge(data.opticalPowerDbm)}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Port Terpakai:</span>
                <span className="font-semibold text-slate-800">
                  {(data.homeCustomers?.length || 0) + (data.hotspotPartners?.length || 0)} dari {data.splitterCapacity} Port
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Sisa Port Kosong:</span>
                <span className="font-bold text-emerald-600">
                  {Math.max(0, data.splitterCapacity - ((data.homeCustomers?.length || 0) + (data.hotspotPartners?.length || 0)))} Port Tersedia
                </span>
              </div>
              {data.coordinates && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Koordinat Tiang:</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.coordinates)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#0B4EA2] hover:underline font-mono"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{data.coordinates}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                  </a>
                </div>
              )}
              {data.notes && (
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Catatan Lapangan:</span>
                  <span className="text-slate-700">{data.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* Customer Details */}
          {type === "CUSTOMER" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Paket Kecepatan:</span>
                <span className="font-bold text-[#0B4EA2]">{data.packageName || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Redaman Pelanggan:</span>
                <div className="mt-0.5">{getSignalBadge(data.signalDbm)}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status Langganan:</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    data.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : data.status === "ISOLATED"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {data.status === "ACTIVE" ? "Aktif" : data.status === "ISOLATED" ? "Terisolir" : "Nonaktif"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">User PPPoE / Mikhmon:</span>
                <span className="font-mono text-slate-800">{data.mikhmonUsername || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Kontak WhatsApp:</span>
                <a
                  href={`https://wa.me/${data.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-mono"
                >
                  <Phone className="w-3 h-3" />
                  <span>{data.phone}</span>
                </a>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Alamat:</span>
                <span className="text-slate-700">{data.address || "-"}</span>
              </div>
              {data.devices && data.devices.length > 0 && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[11px] mb-1">Perangkat ONT Terpasang:</span>
                  <div className="space-y-1">
                    {data.devices.map((d: any) => (
                      <div key={d.id} className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{d.brandModel}</div>
                          <div className="text-[10px] text-slate-500 font-mono">SN: {d.serialNumber}</div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          {d.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Partner Details */}
          {type === "PARTNER" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Pemilik:</span>
                <span className="font-semibold text-slate-800">{data.ownerName || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nomor WhatsApp:</span>
                <a
                  href={`https://wa.me/${data.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-mono"
                >
                  <Phone className="w-3 h-3" />
                  <span>{data.phone}</span>
                </a>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px]">Lokasi Warung / Titik:</span>
                <span className="text-slate-700">{data.address || "-"}</span>
              </div>
              {data.notes && (
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Catatan Titik Hotspot:</span>
                  <span className="text-slate-700">{data.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* Core NOC / Router POP Details */}
          {type === "CORE" && (
            <div className="space-y-3">
              {data.brandModel ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Model Router:</span>
                    <span className="font-bold text-slate-800">{data.brandModel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">IP Gateway:</span>
                    <span className="font-mono font-bold text-[#0B4EA2]">{data.ipAddress || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Lokasi POP / Site:</span>
                    <span className="font-semibold text-slate-800">{data.siteLocation || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Peran Gateway:</span>
                    <span className="font-semibold text-slate-800">
                      {data.isCoreGateway ? "Core Gateway Pusat" : "Router Distribusi (POP)"}
                    </span>
                  </div>
                  {data.notes && (
                    <div className="col-span-2 pt-1 border-t border-slate-200">
                      <span className="text-slate-400 block text-[11px]">Catatan Interface:</span>
                      <span className="text-slate-700 font-mono text-[11px]">{data.notes}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-600">
                    Pusat NOC (Network Operation Center) menghubungkan upstream bandwidth ISP utama melalui Core Router ke seluruh perangkat OLT tapakNet.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] text-slate-400">Status Uplink:</div>
                      <div className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif / 1 Gbps Fiber
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="text-[11px] text-slate-400">Gateway Distribusi:</div>
                      <div className="font-bold text-slate-800 mt-0.5">MikroTik CCR Series</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cloud / ISP Details */}
          {type === "CLOUD" && (
            <div className="space-y-3">
              {data.bandwidthMbps ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kapasitas Bandwidth:</span>
                    <span className="font-bold text-emerald-700 text-sm">{data.bandwidthMbps} Mbps</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tipe Layanan:</span>
                    <span className="font-semibold text-slate-800">{data.serviceType || "DEDICATED"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Biaya Bulanan:</span>
                    <span className="font-bold text-slate-900">
                      {data.monthlyCost ? formatRupiah(data.monthlyCost) : "Gratis"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status Link:</span>
                    <span className="font-bold text-emerald-600">{data.status || "ACTIVE"}</span>
                  </div>
                  {data.circuitId && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Circuit ID:</span>
                      <span className="font-mono font-bold text-slate-800">{data.circuitId}</span>
                    </div>
                  )}
                  {data.contactPhone && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">No. Helpdesk ISP:</span>
                      <span className="font-mono text-slate-700">{data.contactPhone}</span>
                    </div>
                  )}
                  {data.notes && (
                    <div className="col-span-2 pt-1 border-t border-slate-200">
                      <span className="text-slate-400 block text-[11px]">Catatan BGP / IP:</span>
                      <span className="text-slate-700 font-mono text-[11px]">{data.notes}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-600">
                  Upstream gateway internet utama menghubungkan seluruh jaringan tapakNet ke backbone penyedia internet global melalui sambungan serat optik berkecepatan tinggi.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#0B4EA2] hover:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Tutup Informasi
          </button>
        </div>
      </div>
    </div>
  );
}
