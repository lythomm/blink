"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  getGuestId,
  savePendingPhoto,
  getPendingPhotos,
  removePendingPhoto,
} from "@/app/lib/utils";
import {
  Image as ImageIcon,
  Loader2,
  X,
  LayoutGrid,
  Zap,
  RefreshCw,
  Film,
  Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { GuestNameModal } from "@/app/components/GuestNameModal";

export default function CameraPage() {
  const { eventId } = useParams() as { eventId: string };
  const router = useRouter();
  const guestId = getGuestId();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const takePhotoMutation = useMutation(api.photos.takePhoto);
  const joinMutation = useMutation(api.events.joinEvent);
  const remainingPoses = useQuery(api.photos.getRemainingPoses, {
    eventId,
    guestId,
  });
  const photos = useQuery(api.photos.getPhotos, { eventId });
  const event = useQuery(api.events.getEventBySlug, { slug: eventId });

  const lastPhotos = photos?.slice(0, 3) || [];

  useEffect(() => {
    const updatePendingCount = async () => {
      const pending = await getPendingPhotos();
      setPendingCount(pending.length);
    };
    updatePendingCount();

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (eventId && guestId) {
      joinMutation({ eventId, guestId });
    }
  }, [eventId, guestId]);

  useEffect(() => {
    if (isOnline) {
      syncOfflinePhotos();
    }
  }, [isOnline]);

  useEffect(() => {
    startCamera();
    setupWakeLock();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!event?.endsAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = event.endsAt - now;

      if (diff <= 0) {
        setTimeLeft("Expiré");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m restants`);
      } else {
        setTimeLeft(`${minutes}m restants`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [event?.endsAt]);

  const setupWakeLock = async () => {
    if ("wakeLock" in navigator) {
      try {
        await (navigator as any).wakeLock.request("screen");
      } catch (err) {
        console.error("Wake Lock failed:", err);
      }
    }
  };

  const startCamera = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) return;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
    }
  };

  const capture = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      remainingPoses === 0 ||
      isProcessing ||
      isUploading
    )
      return;

    setIsProcessing(true);
    setIsCapturing(true);
    // End flash quickly for snappy feel
    setTimeout(() => setIsCapturing(false), 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (context) {
      // Capture at a slightly lower but high quality res if needed, 
      // but let's stick to video res for quality.
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.filter =
        "sepia(0.2) contrast(1.1) saturate(0.9) brightness(1.05)";
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Add lighter grain (fewer points, slightly larger for visible but faster effect)
      context.fillStyle = "rgba(255,255,255,0.02)";
      for (let i = 0; i < 800; i++) {
        context.fillRect(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          2,
          2,
        );
      }

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            handleUpload(blob);
          }
        },
        "image/webp",
        0.8,
      );
    }
  };

  const handleUpload = async (blob: Blob) => {
    setIsUploading(true);
    if (!navigator.onLine) {
      await savePendingPhoto(blob, eventId, guestId);
      setPendingCount((prev) => prev + 1);
      setIsUploading(false);
      return;
    }

    try {
      const cloudinaryData = await uploadToCloudinary(blob, eventId);
      await takePhotoMutation({
        eventId,
        guestId,
        cloudinaryId: cloudinaryData.public_id,
      });
    } catch (err) {
      console.error("Upload failed, saving locally:", err);
      await savePendingPhoto(blob, eventId, guestId);
      setPendingCount((prev) => prev + 1);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const uploadToCloudinary = async (blob: Blob, eId: string) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `blink/${eId}`;
    const paramsToSign = { timestamp, folder };

    const signResponse = await fetch("/api/sign-cloudinary", {
      method: "POST",
      body: JSON.stringify({ paramsToSign }),
    });
    const { signature } = await signResponse.json();

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    return uploadResponse.json();
  };

  const syncOfflinePhotos = async () => {
    const pending = await getPendingPhotos();
    for (const photo of pending) {
      try {
        const cloudinaryData = await uploadToCloudinary(photo.blob, photo.eventId);
        await takePhotoMutation({
          eventId: photo.eventId,
          guestId: photo.guestId,
          cloudinaryId: cloudinaryData.public_id,
        });
        await removePendingPhoto(photo.id);
        setPendingCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Sync failed for photo", photo.id, err);
      }
    }
  };

  return (
    <main className="fixed inset-0 bg-black flex flex-col overflow-hidden text-white font-sans">
      <GuestNameModal eventId={eventId} guestId={guestId} />
      <div className="grain-overlay" />

      {/* Top Navigation Bar - Absolute Overlay */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-12 z-30 pointer-events-none">
        <button
          onClick={() => router.push(`/event/${eventId}/gallery`)}
          className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/5">
          <Timer className="w-3.5 h-3.5 text-white/60" />
          <span className="text-[11px] font-medium tracking-wide">{timeLeft || "Calcul en cours..."}</span>
        </div>

        <button className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10">
          <LayoutGrid className="w-5 h-5" />
        </button>
      </header>

      {/* Main Camera Viewport - Full Screen Upper */}
      <section className="flex-1 relative overflow-hidden">
        <div className="relative w-full h-full bg-neutral-900 overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{
              filter:
                "sepia(0.15) contrast(1.1) brightness(1.02) saturate(0.9)",
            }}
          />

          <AnimatePresence>
            {isCapturing && (
              <motion.div className="absolute inset-0 z-50 flex flex-col pointer-events-none">
                {/* Upper Shutter Blade */}
                <motion.div
                  initial={{ y: "-100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-100%" }}
                  transition={{ duration: 0.15, ease: "circIn" }}
                  className="flex-1 bg-black"
                />
                {/* Lower Shutter Blade */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.15, ease: "circIn" }}
                  className="flex-1 bg-black"
                />
                {/* Light Leak / Flash Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0] }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="absolute inset-0 bg-white"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Viewfinder Controls Overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
            <div className="flex justify-between items-start" />

            <div className="flex flex-col gap-6 items-center">
              <div className="w-full flex justify-between items-end">
                {/* Flash Toggle */}
                <button
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className={clsx(
                    "pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full transition-colors",
                    flashEnabled
                      ? "bg-white text-black"
                      : "bg-black/20 text-white/60 backdrop-blur-sm",
                  )}
                >
                  <Zap
                    className={clsx("w-5 h-5", flashEnabled && "fill-current")}
                  />
                </button>

                {/* Zoom Selector */}
                <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
                  <button
                    onClick={() => setZoomLevel(0.5)}
                    className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                      zoomLevel === 0.5
                        ? "bg-white/20 text-white"
                        : "text-white/40",
                    )}
                  >
                    0.5
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                      zoomLevel === 1
                        ? "bg-white/20 text-white"
                        : "text-white/40",
                    )}
                  >
                    1x
                  </button>
                </div>

                {/* Flip Camera */}
                <button className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white/60 backdrop-blur-sm">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Controls */}
      <footer className="px-6 pt-6 pb-8 grid grid-cols-3 items-center z-20">
        {/* Pellicule Counter */}
        <div className="flex justify-start">
          <div className="relative group px-4 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 overflow-hidden">
            {/* The Reel Animation */}
            <div className="flex items-center gap-2">
              <Film className="size-5" />
            </div>
            <div className="relative h-10 w-6 flex flex-col items-center justify-center">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={remainingPoses}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute flex flex-col items-center"
                >
                  {/* Previous number (serif, faded) */}
                  <span className="text-[10px] font-serif italic opacity-20 leading-none mb-1">
                    {(remainingPoses ?? 0) + 1}
                  </span>

                  {/* Current number (main) */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-display font-medium tracking-tighter leading-none">
                      {remainingPoses ?? 0}
                    </span>
                  </div>

                  {/* Next number (serif, faded) */}
                  <span className="text-[10px] font-serif italic opacity-20 leading-none mt-1">
                    {Math.max(0, (remainingPoses ?? 0) - 1)}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Shutter Button */}
        <div className="flex justify-center">
          <button
            onClick={capture}
            disabled={remainingPoses === 0 || isUploading || isProcessing || timeLeft === "Expiré"}
            className={clsx(
              "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
              "before:absolute before:inset-0 before:rounded-full before:border-[3px] before:border-white/20 before:scale-110",
              (remainingPoses === 0 || timeLeft === "Expired")
                ? "opacity-30 grayscale"
                : "hover:scale-105 active:scale-95",
            )}
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              {isUploading && (
                <Loader2 className="w-6 h-6 animate-spin text-black" />
              )}
            </div>
          </button>
        </div>

        {/* Gallery Preview */}
        <div className="flex justify-end pr-4">
          <button
            onClick={() => router.push(`/event/${eventId}/gallery`)}
            className="relative w-10 h-16"
          >
            {lastPhotos.length > 0 ? (
              <div className="relative w-full h-full">
                {lastPhotos.map((photo, i) => (
                  <div
                    key={photo._id}
                    className="absolute inset-0 rounded-lg overflow-hidden border border-white/20 shadow-2xl bg-neutral-800 transition-all duration-500 origin-bottom"
                    style={{
                      transform: `rotate(${(i - (lastPhotos.length - 1) / 2) * 10}deg) translateX(${(i - (lastPhotos.length - 1) / 2) * 20}px) translateY(${Math.abs(i - (lastPhotos.length - 1) / 2) * 4}px)`,
                      zIndex: 10 - i,
                    }}
                  >
                    <img
                      src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,h_100,w_100/${photo.cloudinaryId}`}
                      alt="Preview"
                      className="w-full h-full object-cover grayscale-[0.2]"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white/20" />
              </div>
            )}
          </button>
        </div>
      </footer>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
