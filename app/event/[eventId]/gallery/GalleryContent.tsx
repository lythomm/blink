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
  Image as ImageIcon,
  Camera,
  Loader2,
  HelpCircle,
  Lock,
  ChevronRight,
  QrCode,
  Filter,
  Check,
} from "lucide-react";
import { Modal } from "@/app/components/Modal";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedGuestIds, setAppliedGuestIds] = useState<string[]>([]);
  const [draftGuestIds, setDraftGuestIds] = useState<string[]>([]);
  const [shareUrl, setShareUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [hasCloudinaryError, setHasCloudinaryError] = useState(false);

  const handleOpenFilter = () => {
    setDraftGuestIds(appliedGuestIds);
    setIsFilterOpen(true);
  };

  const toggleDraftGuestId = (id: string) => {
    setDraftGuestIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleApplyFilter = () => {
    setAppliedGuestIds(draftGuestIds);
    setIsFilterOpen(false);
  };

  const filteredPhotos = useMemo(() => {
    if (!photos) return [];
    if (appliedGuestIds.length === 0) return photos;
    const appliedSet = new Set(appliedGuestIds);
    const hasMe = appliedSet.has("me");
    return photos.filter((photo) => {
      if (photo.isOwnPhoto && hasMe) return true;
      return photo.guestId && appliedSet.has(photo.guestId);
    });
  }, [photos, appliedGuestIds]);

  const viewablePhotos = useMemo(() => {
    if (!filteredPhotos) return [];
    if (!isLocked) return filteredPhotos;
    return filteredPhotos.filter((photo) => photo.isOwnPhoto);
  }, [filteredPhotos, isLocked]);

  const lightboxSlides = useMemo(() => {
    return viewablePhotos.map((photo) => {
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
    });
  }, [viewablePhotos, hasCloudinaryError]);

  const draftFilteredCount = useMemo(() => {
    if (!photos) return 0;
    if (draftGuestIds.length === 0) return photos.length;
    const draftSet = new Set(draftGuestIds);
    const hasMe = draftSet.has("me");
    return photos.filter((photo) => {
      if (photo.isOwnPhoto && hasMe) return true;
      return photo.guestId && draftSet.has(photo.guestId);
    }).length;
  }, [photos, draftGuestIds]);

  const uniqueAuthors = useMemo(() => {
    if (!photos) return [];
    const map = new Map<string, { guestId: string; name: string; isOwnPhoto: boolean; count: number }>();
    for (const p of photos) {
      if (!p.guestId) continue;
      const existing = map.get(p.guestId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(p.guestId, {
          guestId: p.guestId,
          name: p.authorName,
          isOwnPhoto: p.isOwnPhoto,
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [photos]);

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
        setTimeLeft(`${hours}h ${minutes}min restants`);
      } else {
        setTimeLeft(`${minutes}min restants`);
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

      {/* Hero Header with Background Cover & Gradient */}
      <header className="relative w-full overflow-hidden pt-4 pb-6 flex flex-col justify-between min-h-[340px] sm:min-h-[380px]">
        {/* Background Image from top photo if available */}
        {photos && photos.length > 0 && photos[0]?.cloudinaryId ? (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <CloudinaryImage
              src={photos[photos.length - 1].cloudinaryId}
              alt="Event cover background"
              fill
              className="object-cover w-full h-full filter"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/75 to-black" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-neutral-900/90 via-black to-black pointer-events-none" />
        )}

        {/* Top Navigation */}
        <div className="relative z-20 flex items-center justify-between px-6 pt-2 pb-4">
          {isCreator ? (
            <>
              <button
                onClick={() => router.push(isAuthenticated ? "/dashboard" : "/")}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 cursor-pointer text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 cursor-pointer text-white/80 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="h-10" />
          )}
        </div>

        {/* Hero Content: Title + Stats */}
        <div className="relative z-10 px-6 space-y-7 text-center my-auto">
          <h1 className="text-3xl sm:text-4xl font-display font-normal leading-tight text-white tracking-wide max-w-xs sm:max-w-md mx-auto">
            {event?.name || "Chargement..."}
          </h1>

          {/* Stat Row */}
          <div className="grid grid-cols-3 gap-2 mx-auto items-center">
            {/* Moments */}
            <div className="flex flex-col items-center">
              <span className="font-serif italic text-2xl text-white font-light">
                {photos ? photos.length.toLocaleString() : 0}
              </span>
              <span className="text-[11px] text-white/50 font-sans tracking-wide mt-0.5">
                Souvenirs
              </span>
            </div>

            {/* Remaining Time */}
            <div className="flex flex-col items-center">
              <span className="font-serif italic text-2xl text-white font-light whitespace-nowrap">
                {timeLeft ? timeLeft.replace(" restants", "") : "0min"}
              </span>
              <span className="text-[11px] text-white/50 font-sans tracking-wide mt-0.5">
                Restant
              </span>
            </div>

            {/* People / Guests */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex flex-col items-center cursor-pointer group"
            >
              <span className="font-serif italic text-2xl text-white font-light">
                {participantCount ?? 0}
              </span>
              <span className="text-[11px] text-white/50 group-hover:text-white/80 font-sans tracking-wide inline-flex items-center justify-center gap-0.5 mt-0.5 transition-colors">
                Invités <ChevronRight className="w-3 h-3 text-white/40" />
              </span>
            </button>
          </div>
        </div>

        {/* Action Bar Floating Pills */}
        <div className="relative z-10 px-3 pt-4 flex items-center gap-3 max-w-md mx-auto w-full">
          {/* Camera Button (Main Pill) */}
          <button
            onClick={() => router.push(`/event/${eventId}`)}
            disabled={timeLeft === "Cloturé"}
            className={`flex-1 h-14 rounded-2xl bg-white text-black flex items-center justify-center transition-all cursor-pointer ${timeLeft === "Cloturé"
              ? "opacity-50 cursor-not-allowed"
              : "active:scale-95 shadow-[0_4px_25px_rgba(255,255,255,0.15)] hover:bg-white/95"
              }`}
          >
            <Camera className="w-6 h-6 text-black" />
          </button>

          {/* Filter Pill Button */}
          <button
            onClick={handleOpenFilter}
            className="relative w-14 h-14 rounded-2xl bg-neutral-900/90 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/90 transition-all active:scale-95 cursor-pointer hover:bg-neutral-800"
            title="Filtrer par utilisateur"
          >
            <Filter className="w-5 h-5 text-white/90" />
            {appliedGuestIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-bold rounded-full border-2 border-black flex items-center justify-center shadow-md">
                {appliedGuestIds.length}
              </span>
            )}
          </button>

          {/* QR Share Pill Button */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="w-14 h-14 rounded-2xl bg-neutral-900/90 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer hover:bg-neutral-800"
            title="Partager l'événement"
          >
            <QrCode className="w-5 h-5 text-white/90" />
          </button>

          {/* Download Pill Button */}
          <button
            onClick={() => {
              toast.warning("Téléchargement bientôt disponible");
            }}
            className="w-14 h-14 rounded-2xl bg-neutral-900/90 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer hover:bg-neutral-800"
            title="Télécharger"
          >
            <Download className="w-5 h-5 text-white/90" />
          </button>
        </div>
      </header>

      {/* Active Filter Indicator */}
      {appliedGuestIds.length > 0 && (
        <div className="px-4 pt-3 pb-1 flex items-center justify-between text-xs text-white/60 z-10 max-w-md mx-auto w-full">
          <span className="flex items-center gap-1.5">
            Filtre :{" "}
            <strong className="text-white font-medium">
              {appliedGuestIds.length === 1 && appliedGuestIds[0] === "me"
                ? "Mes photos"
                : `${appliedGuestIds.length} invité${appliedGuestIds.length > 1 ? "s" : ""} sélectionné${appliedGuestIds.length > 1 ? "s" : ""}`}
            </strong>
          </span>
          <button
            onClick={() => setAppliedGuestIds([])}
            className="text-white/40 hover:text-white underline text-[11px] cursor-pointer"
          >
            Réinitialiser
          </button>
        </div>
      )}

      {/* Photo Grid */}
      <section className="px-3 pt-3 pb-24 z-10">
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {filteredPhotos?.map((photo, idx) => {
              const isPhotoLocked = isLocked && !photo.isOwnPhoto;
              return (
                <motion.div
                  key={photo._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.6 }}
                  className={`relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-2xl border border-white/5 ${isPhotoLocked ? "cursor-default" : "cursor-zoom-in"
                    }`}
                  onClick={() => {
                    if (isPhotoLocked) {
                      const time = timeLeft ? timeLeft.replace(" restants", "") : "quelques instants";
                      toast.warning(`Photos prêtes dans ${time} ! 🤫`);
                      return;
                    }
                    const viewIdx = viewablePhotos.findIndex((p) => p._id === photo._id);
                    if (viewIdx !== -1) {
                      setIndex(viewIdx);
                    }
                  }}
                >
                  <CloudinaryImage
                    src={photo.cloudinaryId}
                    alt="Captured moment"
                    fill
                    aspectRatio="3:4"
                    className={`object-cover transition-all duration-500 ${isPhotoLocked ? "blur-md scale-110 pointer-events-none select-none" : "group-hover:scale-105"
                      }`}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    priority={idx < 4}
                    effects={hasCloudinaryError ? [] : PHOTO_EFFECTS}
                    onError={() => setHasCloudinaryError(true)}
                  />

                  {isPhotoLocked && (
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
                </motion.div>
              );
            })}
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

        {photos && photos.length > 0 && filteredPhotos?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 opacity-60">
            <Filter className="w-10 h-10 text-white/40" />
            <p className="text-sm font-light">Aucune photo trouvée pour ce filtre.</p>
            <button
              onClick={() => setAppliedGuestIds([])}
              className="text-xs text-white underline pt-1 cursor-pointer"
            >
              Afficher toutes les photos
            </button>
          </div>
        )}
      </section>

      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        plugins={[LightboxDownload]}
        carousel={{ padding: 0, imageFit: "contain" }}
        slides={lightboxSlides}
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
              <span className="text-white font-medium">prototype</span>.
            </p>
            <p className="pt-2 border-t border-white/10">
              Vos retours sont précieux ! N&apos;hésitez pas à m'en faire si
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

      {/* Filter Modal */}
      <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
        <div className="space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-display text-white">Filtrer les photos</h2>
            <p className="text-xs text-white/40 mt-1">
              Sélectionnez un ou plusieurs invités à afficher
            </p>
          </div>

          {/* Quick Filter Actions */}
          <div className="flex items-center justify-between gap-2 px-1 text-xs">
            <button
              onClick={() => setDraftGuestIds([])}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${draftGuestIds.length === 0
                ? "bg-white text-black border-white font-medium"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                }`}
            >
              Tout afficher ({photos?.length ?? 0})
            </button>
            {draftGuestIds.length > 0 && (
              <button
                onClick={() => setDraftGuestIds([])}
                className="text-white/40 hover:text-white underline text-[11px] cursor-pointer"
              >
                Réinitialiser ({draftGuestIds.length})
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
            {/* Option: Mes photos */}
            {(() => {
              const isSelected = draftGuestIds.includes("me");
              const ownPhotoCount = photos?.filter((p) => p.isOwnPhoto).length ?? 0;
              return (
                <button
                  onClick={() => toggleDraftGuestId("me")}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected
                    ? "bg-white text-black border-white font-medium shadow-md"
                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? "bg-black border-black text-white" : "border-white/30 bg-white/5"
                      }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm font-medium">Mes photos</span>
                  </div>
                  <span className={`text-xs ${isSelected ? "text-black/60" : "text-white/40"}`}>
                    {ownPhotoCount} photo{ownPhotoCount > 1 ? "s" : ""}
                  </span>
                </button>
              );
            })()}

            {/* Divider */}
            {uniqueAuthors.filter((a) => !a.isOwnPhoto).length > 0 && (
              <div className="pt-3 pb-1 text-[11px] uppercase tracking-wider font-semibold text-white/30 px-1">
                Invités
              </div>
            )}

            {/* Unique Authors List */}
            {uniqueAuthors
              .filter((a) => !a.isOwnPhoto)
              .map((author) => {
                const isSelected = draftGuestIds.includes(author.guestId);
                return (
                  <button
                    key={author.guestId}
                    onClick={() => toggleDraftGuestId(author.guestId)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected
                      ? "bg-white text-black border-white font-medium shadow-md"
                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? "bg-black border-black text-white" : "border-white/30 bg-white/5"
                        }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm font-medium">{author.name}</span>
                    </div>
                    <span className={`text-xs ${isSelected ? "text-black/60" : "text-white/40"}`}>
                      {author.count} photo{author.count > 1 ? "s" : ""}
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleApplyFilter}
            className="w-full h-12 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-white/90 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Afficher les photos ({draftFilteredCount})
          </button>
        </div>
      </Modal>

      <PWAInstallBanner />
    </main>
  );
}
