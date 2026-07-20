"use client";

import { useParams, useRouter } from "next/navigation";
import { useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getGuestId } from "@/app/lib/utils";
import { getCldImageUrl } from "next-cloudinary";
import {
  CloudinaryImage,
  PHOTO_EFFECTS,
} from "@/app/components/CloudinaryImage";

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
  HelpCircle,
  Lock,
} from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import LightboxDownload from "yet-another-react-lightbox/plugins/download";
import { GuestNameModal } from "@/app/components/GuestNameModal";
import { useToast } from "@/app/components/Toast";
import { PWAInstallBanner } from "@/app/components/PWAInstallBanner";
import { QRCodeImage } from "@/app/components/QRCodeImage";

export default function GalleryContent() {
  const { eventId } = useParams() as { eventId: string };
  const router = useRouter();
  const guestId = getGuestId();
  const toast = useToast();
  const { isAuthenticated } = useConvexAuth();

  const user = useQuery(api.users.current);
  const photos = useQuery(api.photos.getPhotos, { eventId, clientGuestId: guestId });
  const event = useQuery(api.events.getEventById, { id: eventId });
  const deletePhotoSecureAction = useAction(api.cloudinary.deletePhotoSecure);
  const joinMutation = useMutation(api.events.joinEvent);
  const participantCount = useQuery(api.events.getParticipantCount, {
    eventId,
  });

  const isCreator = user && event && user._id === event.creatorId;

  const [deletingId, setDeletingId] = useState<Id<"photos"> | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [index, setIndex] = useState(-1);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [hasCloudinaryError, setHasCloudinaryError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/event/${eventId}/gallery`);
    }
  }, [eventId]);

  const handleDelete = async (photoId: Id<"photos">) => {
    if (!confirm("Effacer ce souvenir définitivement ?")) return;
    setDeletingId(photoId);
    try {
      await deletePhotoSecureAction({ photoId, guestId });
      toast.success("Souvenir supprimé avec succès ! 🗑️");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Impossible de supprimer la photo.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (eventId && guestId) {
      joinMutation({ eventId, guestId });
    }
  }, [eventId, guestId, joinMutation]);

  useEffect(() => {
    if (!event?.endsAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = event.endsAt - now;

      if (diff <= 0) {
        setTimeLeft("Cloturé");
        setIsLocked(false);
        return;
      }

      setIsLocked(true);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m restants`);
      } else {
        setTimeLeft(`${minutes}m restants`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event?.endsAt]);

  return (
    <main className="flex-1 flex flex-col bg-black text-white relative h-dvh overflow-y-auto custom-scrollbar w-full">
      <div className="grain-overlay pointer-events-none" />
      <GuestNameModal eventId={eventId} guestId={guestId} />

      {/* Top Bar */}
      {isCreator && (
        <nav className="flex items-center justify-between px-5 py-6 z-20">
          <button
            onClick={() => router.push(isAuthenticated ? "/dashboard" : "/")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 cursor-pointer">
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
        <button
          onClick={() => {
            toast.warning("Téléchargement groupé disponible très bientôt !");
          }}
          className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-white/10 active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsShareOpen(true)}
          className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-white/10 active:scale-95 cursor-pointer"
          title="Partager l'événement"
        >
          <UserPlus className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push(`/event/${eventId}`)}
          disabled={timeLeft === "Cloturé"}
          className={`flex-[1.5] h-12 flex items-center justify-center gap-2 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${timeLeft === "Cloturé"
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
                className={`relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-2xl border border-white/5 ${isLocked ? "cursor-default" : "cursor-zoom-in"
                  }`}
                onClick={() => {
                  if (isLocked) {
                    const time = timeLeft ? timeLeft.replace(" restants", "") : "quelques instants";
                    toast.warning(`Photos prêtes dans ${time} ! 🤫`);
                    return;
                  }
                  setIndex(idx);
                }}
              >
                <CloudinaryImage
                  src={photo.cloudinaryId}
                  alt="Captured moment"
                  fill
                  aspectRatio="3:4"
                  className={`object-cover transition-all duration-500 ${isLocked ? "blur-md scale-110 pointer-events-none select-none" : "group-hover:scale-105"
                    }`}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  priority={idx < 4}
                  effects={hasCloudinaryError ? [] : PHOTO_EFFECTS}
                  onError={() => setHasCloudinaryError(true)}
                />

                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-10">
                    <div className="p-3 rounded-full bg-black/60 border border-white/10 text-white/80 shadow-lg backdrop-blur-md">
                      <Lock className="w-5 h-5" />
                    </div>
                  </div>
                )}

                {/* Guest Label */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="text-[10px] font-medium text-white bg-black/10 px-2.5 py-1 rounded-full border border-white/10">
                    {photo.isOwnPhoto ? "Moi" : photo.authorName}
                  </span>
                </div>

                {/* Actions Overlay */}
                {/* {photo.isOwnPhoto && (
                  <div className="absolute bottom-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo._id);
                      }}
                      disabled={deletingId === photo._id}
                      className="p-2 bg-black/50 backdrop-blur-xl rounded-full transition-colors pointer-events-auto cursor-pointer"
                    >
                      {deletingId === photo._id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                )} */}
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
        open={index >= 0 && !isLocked}
        close={() => setIndex(-1)}
        plugins={[LightboxDownload]}
        carousel={{ padding: 0, imageFit: "contain" }}
        slides={photos?.map((photo) => {
          const viewUrl = getCldImageUrl({
            src: photo.cloudinaryId,
            deliveryType: "upload",
            width: 1080,
            height: 1920,
            crop: "fill",
            effects: hasCloudinaryError ? [] : PHOTO_EFFECTS,
          });
          const downloadUrl = getCldImageUrl({
            src: photo.cloudinaryId,
            deliveryType: "upload",
            flags: ["attachment"],
          });
          return {
            src: viewUrl,
            download: downloadUrl,
          };
        })}
      />

      {/* About Button */}
      <button
        onClick={() => setIsAboutOpen(true)}
        className="fixed bottom-6 right-6 z-[60] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* About Modal */}
      <Modal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)}>
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-display text-white">À propos</h2>
          </div>

          <div className="space-y-4 text-sm text-white/80 leading-relaxed">
            <p>
              Salut ! Je m&apos;appelle{" "}
              <span className="text-white font-medium">Thomas</span>, je suis le
              développeur de Blink.
            </p>
            <p>
              L&apos;app est encore au stade de{" "}
              <span className="text-white font-medium">prototype</span>. Donc,
              il est normal de rencontrer quelques bugs ou comportements
              inattendus.
            </p>
            <p className="pt-2 border-t border-white/10">
              Vos retours sont précieux ! N&apos;hésitez pas à me contacter si
              vous rencontrez des problèmes ou si vous avez des suggestions :
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

      {/* Share Modal */}
      <Modal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)}>
        <div className="space-y-6 flex flex-col items-center">
          <div className="text-center">
            <h2 className="text-2xl font-display text-white">Inviter des amis</h2>
            <p className="text-xs text-white/40 mt-1">
              Partagez ce QR Code pour qu'ils rejoignent l'album "{event?.name || ""}"
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 bg-white/5 rounded-2xl blur-xl transition-opacity" />
            <div className="relative bg-white p-4 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden">
              {shareUrl && (
                <QRCodeImage
                  text={shareUrl}
                  size={200}
                  className="w-44 h-44 object-contain rounded-lg"
                  onGenerate={setQrDataUrl}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => {
                if (shareUrl) {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Lien d'invitation copié 🔗");
                }
              }}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-white/90 active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            >
              Copier le lien
            </button>
            <button
              onClick={() => {
                if (qrDataUrl) {
                  const link = document.createElement("a");
                  link.href = qrDataUrl;
                  link.download = `qr-code-${event?.name ? event.name.replace(/\s+/g, "-").toLowerCase() : "event"}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success("QR Code téléchargé ! 📲");
                } else {
                  toast.error("QR Code non disponible");
                }
              }}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-white/10 active:scale-95 cursor-pointer"
            >
              Télécharger le QR
            </button>
          </div>
        </div>
      </Modal>

      <PWAInstallBanner />
    </main>
  );
}
