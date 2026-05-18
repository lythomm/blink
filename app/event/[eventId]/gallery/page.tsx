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
  HelpCircle,
  X,
} from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import clsx from "clsx";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { GuestNameModal } from "@/app/components/GuestNameModal";

export default function GalleryPage() {
  const { eventId } = useParams() as { eventId: string };
  const router = useRouter();
  const guestId = getGuestId();
  const { isAuthenticated } = useConvexAuth();

  const user = useQuery(api.users.current);
  const photos = useQuery(api.photos.getPhotos, { eventId });
  const event = useQuery(api.events.getEventBySlug, { slug: eventId });
  const deletePhotoMutation = useMutation(api.photos.deletePhoto);
  const deleteFromCloudinary = useAction(api.cloudinary.deleteFromCloudinary);
  const joinMutation = useMutation(api.events.joinEvent);
  const participantCount = useQuery(api.events.getParticipantCount, {
    eventId,
  });

  const isCreator = user && event && user._id === event.creatorId;

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [index, setIndex] = useState(-1);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

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
        setTimeLeft("Cloturé");
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
      <GuestNameModal eventId={eventId} guestId={guestId} />

      {/* Top Bar */}
      {isCreator && (
        <nav className="flex items-center justify-between px-5 py-6 z-20">
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
      )}

      {/* Hero Section */}
      <header
        className={`px-6 pt-2 pb-8 space-y-6 z-10 ${isCreator ? "" : "pt-12"}`}
      >
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
        <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold uppercase tracking-widest transition-colors">
          <Download className="w-4 h-4" />
        </button>
        <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold uppercase tracking-widest transition-colors">
          <UserPlus className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push(`/event/${eventId}`)}
          disabled={timeLeft === "Cloturé"}
          className={`flex-[1.5] h-12 flex items-center justify-center gap-2 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-widest transition-all ${
            timeLeft === "Cloturé"
              ? "opacity-50 cursor-not-allowed"
              : "active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          }`}
        >
          <Camera className="w-4 h-4" />
          Caméra
        </button>
      </section>

      {/* Grid Border Separator */}
      <div className="px-5 mb-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Photo Grid */}
      <section className="px-3 pb-24 z-10">
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {photos?.map((photo, idx) => (
              <motion.div
                key={photo._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.6 }}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-2xl border border-white/5 cursor-zoom-in"
                onClick={() => setIndex(idx)}
              >
                <Image
                  src={photo.cloudinaryId}
                  alt="Captured moment"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                  priority={idx < 4}
                />

                {/* Guest Label */}
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-medium text-white bg-black/10 px-2.5 py-1 rounded-full border border-white/10">
                    {photo.guestId === guestId
                      ? "Moi"
                      : (photo as any).authorName}
                  </span>
                </div>

                {/* Actions Overlay */}
                {photo.guestId === guestId && (
                  <div className="absolute bottom-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo._id, photo.cloudinaryId);
                      }}
                      disabled={deletingId === photo._id}
                      className="p-2 bg-black/50 backdrop-blur-xl rounded-full transition-colors pointer-events-auto"
                    >
                      {deletingId === photo._id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-white" />
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

      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        carousel={{ padding: 0, imageFit: "contain" }}
        slides={photos?.map((photo) => ({
          src: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${photo.cloudinaryId}`,
        }))}
      />

      {/* About Button */}
      <button
        onClick={() => setIsAboutOpen(true)}
        className="fixed bottom-6 right-6 z-[60] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* About Modal */}
      <Modal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)}>
        <div className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl font-display text-white">À propos</h2>
            <p className="text-sm text-white/50">Blink (Prototype)</p>
          </div>

          <div className="space-y-4 text-sm text-white/80 leading-relaxed">
            <p>
              Salut ! Je m'appelle <span className="text-white font-medium">Thomas</span> et j'ai développé ce projet.
            </p>
            <p>
              Blink est actuellement un <span className="text-white font-medium">prototype</span>. Il est normal de rencontrer quelques bugs ou comportements inattendus pendant son utilisation.
            </p>
            <p className="pt-2 border-t border-white/10">
              Vos retours sont précieux ! N'hésitez pas à me contacter si vous rencontrez des problèmes ou si vous avez des suggestions :
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <a 
                href="tel:0611597627" 
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  📞
                </div>
                <span className="font-medium">06 11 59 76 27</span>
              </a>
              
              <a 
                href="mailto:lythomm@gmail.com" 
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  ✉️
                </div>
                <span className="font-medium">lythomm@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
