"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useState, useEffect } from "react";
import { ToastProvider } from "./components/Toast";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://lovable-weasel-358.eu-west-1.convex.cloud";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [convex] = useState(() => new ConvexReactClient(convexUrl));

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ConvexAuthNextjsProvider client={convex}>
      <ToastProvider>{children}</ToastProvider>
    </ConvexAuthNextjsProvider>
  );
}
