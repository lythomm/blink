"use client";

import { ConvexClientProvider } from "./ConvexClientProvider";
import { ToastProvider } from "./components/Toast";
import { ReactNode, useEffect } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.error("Service worker registration failed:", err);
        });
      });
    }
  }, []);

  return (
    <ToastProvider>
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ToastProvider>
  );
}

