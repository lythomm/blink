"use client";

import { ConvexClientProvider } from "./ConvexClientProvider";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
