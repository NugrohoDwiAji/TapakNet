import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import PwaRegister from "@/components/pwa/PwaRegister";

export const viewport: Viewport = {
  themeColor: "#072255",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "tapakNet - RT/RW Net ERP & Management System",
  description:
    "Single Source of Truth for financial accounting, flexible partner voucher consignment tracking, monthly home customer billing, and physical device/ODP topology documentation.",
  manifest: "/manifest.webmanifest",
  applicationName: "tapakNet",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "tapakNet ERP",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192x192.png",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e && e.message && (e.message.indexOf('Loading chunk') !== -1 || e.message.indexOf('ChunkLoadError') !== -1)) {
                  console.warn('ChunkLoadError detected, reloading page to fetch fresh bundle...');
                  var key = 'chunk_reload_' + window.location.pathname;
                  if (!sessionStorage.getItem(key)) {
                    sessionStorage.setItem(key, '1');
                    window.location.reload();
                  }
                }
              });
              window.addEventListener('load', function() {
                var key = 'chunk_reload_' + window.location.pathname;
                sessionStorage.removeItem(key);
              });
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans">
        <PwaRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
