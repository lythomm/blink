"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  ZapOff,
  RefreshCw,
  Film,
  Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { GuestNameModal } from "@/app/components/GuestNameModal";
import { useToast } from "@/app/components/Toast";
import { CloudinaryImage } from "@/app/components/CloudinaryImage";

interface NavigatorWithWakeLock {
  wakeLock?: {
    request(type: "screen"): Promise<unknown>;
  };
}

interface TorchConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

export default function CameraContent() {
  const { eventId } = useParams() as { eventId: string };
  const router = useRouter();
  const guestId = getGuestId();
  const toast = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const activeRequestIdRef = useRef<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const [flashEnabled, setFlashEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [timeLeft, setTimeLeft] = useState<string>("");

  const takePhotoMutation = useMutation(api.photos.takePhoto);
  const joinMutation = useMutation(api.events.joinEvent);
  const remainingPoses = useQuery(api.photos.getRemainingPoses, {
    eventId,
    guestId,
  });
  const photos = useQuery(api.photos.getPhotos, { eventId });
  const event = useQuery(api.events.getEventById, { id: eventId });

  const lastPhotos = photos?.slice(0, 3) || [];

  // Functions (with useCallback to avoid re-renders and satisfy react-hooks/exhaustive-deps)
  const setupWakeLock = useCallback(async () => {
    const nav = navigator as unknown as NavigatorWithWakeLock;
    if (nav.wakeLock) {
      try {
        await nav.wakeLock.request("screen");
      } catch (err) {
        console.error("Wake Lock failed:", err);
      }
    }
  }, []);

  const stopActiveStream = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Defer state update to avoid synchronous cascading renders inside useEffect
    setTimeout(() => {
      setStream(null);
    }, 0);
  }, []);

  const startCamera = useCallback(
    async (mode = facingMode) => {
      if (typeof window === "undefined" || !navigator.mediaDevices) return;

      const requestId = ++activeRequestIdRef.current;

      // Stop the previous stream immediately
      stopActiveStream();

      // Short delay to let the OS release the camera resource
      await new Promise((resolve) => setTimeout(resolve, 200));

      // If a newer request was initiated during our delay, abort
      if (requestId !== activeRequestIdRef.current) {
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        // If a newer request was initiated during getUserMedia, stop this stream and abort
        if (requestId !== activeRequestIdRef.current) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStreamRef.current = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        if (requestId === activeRequestIdRef.current) {
          console.error("Camera access failed:", err);
        }
      }
    },
    [facingMode, stopActiveStream],
  );

  const uploadToCloudinary = useCallback(async (blob: Blob, eId: string) => {
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
  }, []);

  const syncOfflinePhotos = useCallback(async () => {
    const pending = await getPendingPhotos();
    if (pending.length === 0) return;

    let syncedCount = 0;
    for (const photo of pending) {
      try {
        const cloudinaryData = await uploadToCloudinary(
          photo.blob,
          photo.eventId,
        );
        await takePhotoMutation({
          eventId: photo.eventId,
          guestId: photo.guestId,
          cloudinaryId: cloudinaryData.public_id,
        });
        await removePendingPhoto(photo.id);
        syncedCount++;
      } catch (err) {
        console.error("Sync failed for photo", photo.id, err);
      }
    }
    if (syncedCount > 0) {
      toast.success(`${syncedCount} photo(s) synchronisée(s) avec succès ! ✨`);
    }
  }, [takePhotoMutation, toast, uploadToCloudinary]);

  const handleUpload = useCallback(
    async (blob: Blob) => {
      setIsUploading(true);
      if (!navigator.onLine) {
        await savePendingPhoto(blob, eventId, guestId);
        setIsUploading(false);
        toast.warning("Photo sauvegardée localement (hors-ligne)");
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
        toast.warning("Envoi échoué, cliché sauvegardé localement");
      } finally {
        setIsUploading(false);
        setIsProcessing(false);
      }
    },
    [eventId, guestId, takePhotoMutation, toast, uploadToCloudinary],
  );

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing || isUploading)
      return;

    if (remainingPoses === 0) {
      toast.error("Votre pellicule est pleine ! Plus de poses disponibles.");
      return;
    }

    setIsProcessing(true);
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const track = stream?.getVideoTracks()[0];

    // End flash white visual overlay quickly for snappy feel
    setTimeout(() => setIsCapturing(false), 150);

    // If flash is enabled and we are on back camera, physically turn on the torch first
    if (flashEnabled && facingMode === "environment" && track) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: true } as TorchConstraintSet],
        });
        // Small delay to let the flashlight fire and illuminate the scene before capturing
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (e) {
        console.log("Failed to turn on physical flash:", e);
      }
    }

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the raw camera frame directly
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Turn off physical torch immediately after capturing the canvas frame
      if (flashEnabled && facingMode === "environment" && track) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: false } as TorchConstraintSet],
          });
        } catch (e) {
          console.log("Failed to turn off physical flash:", e);
        }
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
    } else {
      setIsProcessing(false);
    }
  }, [
    facingMode,
    flashEnabled,
    handleUpload,
    isProcessing,
    isUploading,
    remainingPoses,
    stream,
    toast,
  ]);

  const toggleCamera = useCallback(() => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
  }, [facingMode]);

  // Effects
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connexion rétablie ! Vos photos vont être synchronisées.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning(
        "Mode hors-ligne activé. Vos clichés seront sauvegardés sur votre appareil.",
      );
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  useEffect(() => {
    if (eventId && guestId) {
      joinMutation({ eventId, guestId });
    }
  }, [eventId, guestId, joinMutation]);

  useEffect(() => {
    if (isOnline) {
      syncOfflinePhotos();
    }
  }, [isOnline, syncOfflinePhotos]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera(facingMode);
    setupWakeLock();
    return () => {
      stopActiveStream();
    };
  }, [facingMode, startCamera, setupWakeLock, stopActiveStream]);

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
          <span className="text-[11px] font-medium tracking-wide">
            {timeLeft || "Calcul en cours..."}
          </span>
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
                "contrast(1.35) saturate(0.75) sepia(0.15) brightness(1.15)",
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
                  {flashEnabled ? (
                    <Zap className="w-5 h-5 fill-current" />
                  ) : (
                    <ZapOff className="w-5 h-5" />
                  )}
                </button>

                {/* Flip Camera */}
                <button
                  onClick={toggleCamera}
                  className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white/60 backdrop-blur-sm"
                >
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
            disabled={
              remainingPoses === 0 ||
              isUploading ||
              isProcessing ||
              timeLeft === "Expiré"
            }
            className={clsx(
              "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
              "before:absolute before:inset-0 before:rounded-full before:border-[3px] before:border-white/20 before:scale-110",
              remainingPoses === 0 || timeLeft === "Expired"
                ? "opacity-30 grayscale"
                : "active:scale-95",
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
                    <CloudinaryImage
                      src={photo.cloudinaryId}
                      width={100}
                      height={100}
                      alt="Preview"
                      className="w-full h-full object-cover"
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
