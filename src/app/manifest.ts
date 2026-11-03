import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "tapakNet ERP - RT/RW Net",
    short_name: "tapakNet",
    description: "RT/RW Net & Hotspot Management System",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#072255",
    theme_color: "#072255",
    orientation: "portrait",
    categories: ["business", "utilities", "productivity"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Pelanggan Rumahan",
        short_name: "Pelanggan",
        description: "Kelola pelanggan bulanan & PPPoE",
        url: "/customers",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Voucher Hotspot",
        short_name: "Hotspot",
        description: "Konsinyasi voucher mitra",
        url: "/hotspot",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Buku Kas & Keuangan",
        short_name: "Keuangan",
        description: "Catat kas & rekapitulasi finansial",
        url: "/finance",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
