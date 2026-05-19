"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Loader2 } from "lucide-react";

interface QRCodeImageProps {
  text: string;
  size?: number;
  className?: string;
  onGenerate?: (dataUrl: string) => void;
}

export function QRCodeImage({
  text,
  size = 256,
  className = "",
  onGenerate,
}: QRCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!text) return;
    setLoading(true);
    setError("");

    QRCode.toDataURL(
      text,
      {
        width: size,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      },
      (err, url) => {
        setLoading(false);
        if (err) {
          console.error("Failed to generate QR Code:", err);
          setError("Erreur de génération");
        } else {
          setDataUrl(url);
          if (onGenerate) {
            onGenerate(url);
          }
        }
      }
    );
  }, [text, size, onGenerate]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-white rounded-xl ${className}`}
        style={{ width: size, height: size }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-black/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-white text-xs text-red-500 font-medium rounded-xl p-4 text-center ${className}`}
        style={{ width: size, height: size }}
      >
        {error}
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
