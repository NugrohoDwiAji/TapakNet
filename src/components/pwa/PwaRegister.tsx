"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log(
              "[tapakNet PWA] Service Worker aktif dengan scope:",
              registration.scope
            );
          })
          .catch((error) => {
            console.warn("[tapakNet PWA] Gagal meregistrasi Service Worker:", error);
          });
      });
    }
  }, []);

  return null;
}
