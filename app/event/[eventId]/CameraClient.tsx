"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const CameraContent = dynamic(() => import("./CameraContent"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
        Chargement de l&apos;appareil...
      </span>
    </div>
  ),
});

export default function CameraClient() {
  return <CameraContent />;
}
