export const UserRole = {
  ADMIN: "ADMIN",
  TECHNICIAN: "TECHNICIAN",
  FINANCE: "FINANCE",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface PermissionItem {
  key: string;
  label: string;
  description: string;
}

export interface PermissionModuleGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  permissions: PermissionItem[];
}

export const PERMISSION_MODULES: PermissionModuleGroup[] = [
  {
    id: "dashboard",
    name: "Executive Dashboard",
    description: "Statistik performa bisnis, ringkasan pendapatan, dan grafik operasional.",
    icon: "LayoutDashboard",
    permissions: [
      {
        key: "dashboard:view",
        label: "Lihat Ringkasan Dashboard",
        description: "Melihat kartu omset, pendapatan MRR, performa mitra, dan grafik kas.",
      },
      {
        key: "dashboard:export",
        label: "Export Laporan Eksekutif",
        description: "Mengunduh dan mencetak ringkasan laporan operasional RT/RW Net.",
      },
    ],
  },
  {
    id: "hotspot",
    name: "Voucher & Hotspot",
    description: "Konsinyasi voucher mitra, drop stok fisik, dan penarikan bagi hasil.",
    icon: "Wifi",
    permissions: [
      {
        key: "hotspot:view",
        label: "Lihat Mitra & Stok",
        description: "Melihat daftar titik hotspot, saldo piutang mitra, dan sisa voucher.",
      },
      {
        key: "hotspot:manage_partner",
        label: "Kelola Mitra Hotspot",
        description: "Menambah, mengedit, dan menghapus titik mitra lokasi hotspot.",
      },
      {
        key: "hotspot:distribute",
        label: "Titip Stok Voucher (Drop)",
        description: "Mencatat serah terima voucher konsinyasi ke pemilik warung/mitra.",
      },
      {
        key: "hotspot:settlement",
        label: "Tarik Setoran Tunai",
        description: "Mencatat penerimaan setoran penjualan voucher dan mencatat ke kas.",
      },
      {
        key: "hotspot:manage_package",
        label: "Kelola Master Paket",
        description: "Menambah, mengedit tarif harga jual, dan persentase bagi hasil voucher.",
      },
    ],
  },
  {
    id: "customers",
    name: "Pelanggan Rumahan (PPPoE/FTTH)",
    description: "Data pelanggan bulanan, status isolir, dan penagihan 12 bulan.",
    icon: "Users",
    permissions: [
      {
        key: "customers:view",
        label: "Lihat Data Pelanggan",
        description: "Melihat tabel pelanggan, status tagihan, dan kontak WhatsApp.",
      },
      {
        key: "customers:create",
        label: "Pasang Baru Pelanggan",
        description: "Mendaftarkan pelanggan baru dan membuat kartu tagihan 12 bulan.",
      },
      {
        key: "customers:edit",
        label: "Edit Profil Pelanggan",
        description: "Mengubah paket tarif, nomor HP, alamat, dan tiang ODP pelanggan.",
      },
      {
        key: "customers:toggle_status",
        label: "Saklar Status (Aktif / Nonaktif)",
        description: "Mengaktifkan atau menonaktifkan status langganan pelanggan.",
      },
      {
        key: "customers:delete",
        label: "Hapus Pelanggan",
        description: "Menghapus pelanggan dan mengembalikan perangkat ke gudang.",
      },
      {
        key: "customers:pay_billing",
        label: "Catat Pembayaran Tagihan",
        description: "Mencatat pembayaran bulanan dan menerbitkan struk WhatsApp.",
      },
      {
        key: "customers:unpay_billing",
        label: "Batalkan Status Lunas",
        description: "Membatalkan pembayaran yang salah dan membersihkan buku kas.",
      },
    ],
  },
  {
    id: "infrastructure",
    name: "FTTH & Inventaris Gudang",
    description: "Dokumentasi OLT, port splitter ODP, dan aset perangkat fisik.",
    icon: "Network",
    permissions: [
      {
        key: "infrastructure:view",
        label: "Lihat Topologi & Gudang",
        description: "Melihat status OLT, okupansi port ODP, dan stok alat gudang.",
      },
      {
        key: "infrastructure:manage_olt",
        label: "Kelola Master OLT",
        description: "Menambah, mengedit IP, dan memelihara data OLT pusat.",
      },
      {
        key: "infrastructure:manage_odp",
        label: "Kelola Titik ODP",
        description: "Menambah, mengedit kapasitas splitter, dan lokasi koordinat ODP.",
      },
      {
        key: "infrastructure:manage_router",
        label: "Kelola Router MikroTik (POP)",
        description: "Menambah, mengedit IP gateway, dan mengelola router titik distribusi (POP).",
      },
      {
        key: "infrastructure:manage_isp",
        label: "Kelola Provider ISP Upstream",
        description: "Mendokumentasikan provider ISP, kapasitas bandwidth hulu, dan biaya bulanan.",
      },
      {
        key: "infrastructure:manage_devices",
        label: "Kelola Inventaris Perangkat",
        description: "Mencatat pembelian alat (CapEx), serial number ONT, dan router.",
      },
    ],
  },
  {
    id: "topology",
    name: "Topologi Jaringan FTTH",
    description: "Visualisasi interaktif struktur jaringan: Core NOC → OLT → PON Port → ODP → Klien & Mitra.",
    icon: "Workflow",
    permissions: [
      {
        key: "topology:view",
        label: "Lihat Diagram Topologi",
        description: "Melihat visualisasi alur distribusi sinyal, redaman dBm, dan okupansi port ODP.",
      },
      {
        key: "topology:export",
        label: "Cetak / Ekspor Dokumentasi",
        description: "Mencetak dan mengunduh topologi jaringan untuk panduan teknisi di lapangan.",
      },
    ],
  },
  {
    id: "finance",
    name: "Buku Kas & Keuangan Induk",
    description: "General ledger, arus kas masuk/keluar, OpEx, CapEx, dan laba rugi.",
    icon: "BookOpenCheck",
    permissions: [
      {
        key: "finance:view",
        label: "Lihat Buku Kas & Laporan",
        description: "Melihat riwayat transaksi kas masuk/keluar dan laba bersih.",
      },
      {
        key: "finance:create_transaction",
        label: "Catat Kas Manual",
        description: "Mencatat biaya listrik, bandwidth ISP hulu, dan gaji karyawan.",
      },
      {
        key: "finance:delete_transaction",
        label: "Hapus Transaksi Kas",
        description: "Menghapus entri pembukuan kas yang dibatalkan.",
      },
    ],
  },
  {
    id: "security",
    name: "Pengguna & Hak Akses (RBAC)",
    description: "Pengelolaan akun login, keamanan otentikasi, dan matriks wewenang.",
    icon: "ShieldAlert",
    permissions: [
      {
        key: "users:view",
        label: "Lihat Daftar Pengguna",
        description: "Melihat akun operator, teknisi, dan administrator.",
      },
      {
        key: "users:manage",
        label: "Kelola Akun Pengguna",
        description: "Menambah, mengedit, mengubah password, dan menghapus pengguna.",
      },
      {
        key: "rbac:manage",
        label: "Konfigurasi Hak Akses (RBAC)",
        description: "Mengubah matriks izin wewenang (Role-Based Access Control).",
      },
    ],
  },
];

// Helper: All Permission Keys flat list
export const ALL_PERMISSION_KEYS: string[] = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.key)
);

// Default permissions assigned to each system role
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ALL_PERMISSION_KEYS, // Full access
  TECHNICIAN: [
    "dashboard:view",
    "hotspot:view",
    "customers:view",
    "customers:create",
    "customers:edit",
    "customers:toggle_status",
    "infrastructure:view",
    "infrastructure:manage_router",
    "infrastructure:manage_isp",
    "infrastructure:manage_olt",
    "infrastructure:manage_odp",
    "infrastructure:manage_devices",
    "topology:view",
    "topology:export",
    "users:view",
  ],
  FINANCE: [
    "dashboard:view",
    "dashboard:export",
    "hotspot:view",
    "hotspot:distribute",
    "hotspot:settlement",
    "customers:view",
    "customers:pay_billing",
    "customers:unpay_billing",
    "topology:view",
    "finance:view",
    "finance:create_transaction",
    "users:view",
  ],
};

export const ROLE_INFO: Record<
  UserRole,
  { name: string; description: string; badgeColor: string }
> = {
  ADMIN: {
    name: "Administrator Utama",
    description: "Akses penuh (Superuser) ke seluruh modul, sistem keuangan, infrastruktur, dan keamanan RBAC.",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  TECHNICIAN: {
    name: "Teknisi Lapangan",
    description: "Wewenang teknis untuk pemasangan pelanggan baru, pengecekan redaman, penataan tiang ODP, dan stok alat.",
    badgeColor: "bg-blue-50 text-[#0B4EA2] border-blue-200",
  },
  FINANCE: {
    name: "Kasir & Staf Keuangan",
    description: "Wewenang penagihan bulanan pelanggan, penarikan setoran voucher hotspot, dan pencatatan kas keluar/masuk.",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};
