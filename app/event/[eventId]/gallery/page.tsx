"use client";

import { useParams, useRouter } from "next/navigation";
import { useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getGuestId } from "@/app/lib/utils";
import Image from "next/image";
import {
  ArrowLeft,
  Settings,
  Download,
  UserPlus,
  Users,
  Timer,
  Image as ImageIcon,
  Camera,
  Loader2,
  Trash2,
  Film,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import clsx from "clsx";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function GalleryPage() {
  const { eventId } = useParams() as { eventId: string };
  const router = useRouter();
  const guestId = getGuestId();
  const { isAuthenticated } = useConvexAuth();

  const photos = useQuery(api.photos.getPhotos, { eventId });
  const event = useQuery(api.events.getEventBySlug, { slug: eventId });
  const deletePhotoMutation = useMutation(api.photos.deletePhoto);
  const deleteFromCloudinary = useAction(api.cloudinary.deleteFromCloudinary);
  const joinMutation = useMutation(api.events.joinEvent);
  const participantCount = useQuery(api.events.getParticipantCount, {
    eventId,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [index, setIndex] = useState(-1);

  const handleDelete = async (photoId: any, cloudinaryId: string) => {
    if (!confirm("Effacer ce souvenir définitivement ?")) return;
    setDeletingId(photoId);
    try {
      await deletePhotoMutation({ id: photoId, guestId });
      await deleteFromCloudinary({ cloudinaryId });
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (eventId && guestId) {
      joinMutation({ eventId, guestId });
    }
  }, [eventId, guestId]);

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
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [event?.endsAt]);

  return (
    <main className="flex-1 flex flex-col bg-black text-white relative h-dvh overflow-y-auto custom-scrollbar">
      <div className="grain-overlay pointer-events-none" />

      {/* Top Bar */}
      <nav className="flex items-center justify-between px-6 py-6 z-20">
        <button
          onClick={() => router.push(isAuthenticated ? "/dashboard" : "/")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5">
          <Settings className="w-5 h-5 text-white/60" />
        </button>
      </nav>

      {/* Hero Section */}
      <header className="px-8 pt-2 pb-8 space-y-6 z-10">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-4xl font-display leading-[1.1]">
            {event?.name || "Chargement..."}
          </h1>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-white/40">
            <Timer className="w-4 h-4" />
            <span className="text-[11px] font-medium tracking-wide uppercase">
              {timeLeft || "Calcul..."}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-white/40">
            <Users className="w-4 h-4" />
            <span className="text-[11px] font-medium tracking-wide uppercase">
              {participantCount ?? 0} participant
              {(participantCount ?? 0) > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-white/40">
            <ImageIcon className="w-4 h-4" />
            <span className="text-[11px] font-medium tracking-wide uppercase">
              {photos?.length ?? 0} Photos
            </span>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <section className="px-6 pb-10 flex items-center gap-3 z-10">
        <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
          <Download className="w-4 h-4" />
          Sauver
        </button>
        <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
          <UserPlus className="w-4 h-4" />
          Inviter
        </button>
        <button
          onClick={() => router.push(`/event/${eventId}`)}
          className="flex-[1.5] h-12 flex items-center justify-center gap-2 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          <Camera className="w-4 h-4" />
          Caméra
        </button>
      </section>

      {/* Grid Border Separator */}
      <div className="px-6 mb-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Photo Grid */}
      <section className="px-6 pb-24 z-10">
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {photos?.map((photo, idx) => (
              <motion.div
                key={photo._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.6 }}
                className="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-2xl border border-white/5 cursor-zoom-in"
                onClick={() => setIndex(idx)}
              >
                <Image
                  src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${photo.cloudinaryId}`}
                  alt="Captured moment"
                  fill
                  className="object-cover grayscale-[0.2] group-hover:scale-110 group-hover:grayscale-0 transition-all duration-700"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />

                {/* Guest Label */}
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] font-medium text-white/60 drop-shadow-md">
                    {photo.guestId === guestId ? "Moi" : "Invité"}
                  </span>
                </div>

                {/* Actions Overlay */}
                {photo.guestId === guestId && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo._id, photo.cloudinaryId);
                      }}
                      disabled={deletingId === photo._id}
                      className="p-3 bg-white/10 backdrop-blur-xl rounded-full hover:bg-red-500/20 transition-colors pointer-events-auto"
                    >
                      {deletingId === photo._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loading / Empty States */}
        {!photos && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-bold">
              Développement...
            </span>
          </div>
        )}

        {photos?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
            <ImageIcon className="w-12 h-12 font-thin" />
            <p className="text-sm font-light">Aucune photo pour le moment.</p>
          </div>
        )}
      </section>

      {/* Footer Branding */}
      <footer className="py-12 flex justify-center opacity-10">
        <p className="text-[9px] uppercase tracking-[0.5em] font-bold">
          Blink — Système Film Unique
        </p>
      </footer>

      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        slides={photos?.map((photo) => ({
          src: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${photo.cloudinaryId}`,
        }))}
      />
    </main>
  );
}
