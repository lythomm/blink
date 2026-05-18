"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const ClientLayout = dynamic(() => import("./ClientLayout"), {
  ssr: false,
});

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
