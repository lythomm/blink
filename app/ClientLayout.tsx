"use client";

import { ConvexClientProvider } from "./ConvexClientProvider";
import { ToastProvider } from "./components/Toast";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ToastProvider>
  );
}
