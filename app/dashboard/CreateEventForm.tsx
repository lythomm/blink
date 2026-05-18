"use client";

import { useState, useEffect } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { MoveRight, ArrowLeft, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { getGuestId, prettyDisplayDate } from "@/app/lib/utils";
import { useToast } from "@/app/components/Toast";

interface CreateEventFormProps {
  createStep: number;
  setCreateStep: (step: number | ((prev: number) => number)) => void;
  onCancel: () => void;
}

export default function CreateEventForm({
  createStep,
  setCreateStep,
  onCancel,
}: CreateEventFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const user = useQuery(api.users.current);
  // const sendWelcomeKit = useAction(api.actions.emails.sendWelcomeKitEmail);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [maxPhotos, setMaxPhotos] = useState(5);

  // Clear error when inputs change
  useEffect(() => {
    setError("");
  }, [name, slug, endDateTime]);

  const createMutation = useMutation(api.events.createEvent);
  const joinMutation = useMutation(api.events.joinEvent);

  const performEventCreation = async () => {
    setIsLoading(true);
    setError("");
    try {
      const endsAt = new Date(endDateTime).getTime();
      await createMutation({
        name,
        slug,
        endsAt,
        maxPhotosPerParticipant: maxPhotos,
      });
      await joinMutation({ eventId: slug, guestId: getGuestId() });

      // Send Welcome Kit email if email is available (disabled for now)
      /*
      const targetEmail = user?.email;
      if (targetEmail) {
        try {
          const targetName = user?.name || targetEmail.split("@")[0];
          await sendWelcomeKit({
            email: targetEmail,
            userName: targetName,
            eventName: name,
            eventSlug: slug,
          });
        } catch (emailErr) {
          console.error("Error sending Welcome Kit email:", emailErr);
        }
      }
      */

      setCreateStep(5);
      setIsLoading(false);
    } catch (err: any) {
      const errorMessage = err.message || "";
      if (errorMessage.includes("déjà utilisé")) {
        setError("Ce code d'événement est déjà utilisé.");
      } else {
        setError("Une erreur est survenue lors de la création.");
      }
      setIsLoading(false);
    }
  };

  const handleCreateStep4Submit = async (
    e?: React.FormEvent | React.MouseEvent,
  ) => {
    e?.preventDefault();
    await performEventCreation();
  };

  return (
    <motion.form
      key="create"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col"
    >
      <div className="h-10 flex items-center justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 -mr-2 text-white/40 transition-colors"
          title="Quitter la création"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center text-left overflow-y-auto">
        <AnimatePresence mode="wait">
          {createStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-display leading-tight">
                Quel est le nom de cet album ?
              </h2>
              <input
                type="text"
                placeholder="Ex: Nouvelle an 2027 chez Oli"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="blink-input"
              />
              {error && createStep === 1 && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-2">
                  {error}
                </p>
              )}
            </motion.div>
          )}

          {createStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-display leading-tight">
                Choisissez un code d'accès unique
              </h2>
              <p className="text-sm text-white/40">
                Ce code permettra à vos invités de rejoindre
                <br />
                l'événement et de capturer des souvenirs.
              </p>
              <input
                type="text"
                placeholder="Ex: alice-2026"
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/\s+/g, ""))}
                maxLength={16}
                className="blink-input uppercase tracking-widest"
              />
              {error && createStep === 2 && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-2">
                  {error}
                </p>
              )}
            </motion.div>
          )}

          {createStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-display leading-tight">
                Quand la pellicule
                <br />
                sera-t-elle prête ?
              </h2>
              <p className="text-sm text-white/40">
                À cette date, l'album sera bloqué et les participants ne
                pourront plus ajouter de photos.
              </p>
              <div className="relative group">
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="blink-input invert-calendar-icon text-transparent"
                />
                <div className="absolute inset-0 flex items-center px-6 pointer-events-none">
                  <span
                    className={clsx(
                      "text-[15px] font-body transition-all duration-300",
                      endDateTime ? "text-white" : "text-white/20",
                    )}
                  >
                    {endDateTime
                      ? prettyDisplayDate(endDateTime)
                      : "Choisir une date et heure"}
                  </span>
                </div>
              </div>
              {error && createStep === 3 && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-2">
                  {error}
                </p>
              )}
            </motion.div>
          )}

          {createStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-display leading-tight">
                Combien de photos par personne ?
              </h2>
              <p className="text-sm text-white/40">
                Fixez une limite pour préserver l'aspect
                <br />
                précieux de chaque cliché.
              </p>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 25, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMaxPhotos(val)}
                    className={clsx(
                      "blink-choice",
                      maxPhotos === val && "blink-choice-selected",
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {error && createStep === 4 && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-6">
                  {error}
                </p>
              )}
            </motion.div>
          )}
          {createStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center space-y-8 text-center py-4"
            >
              <div className="space-y-4">
                <div className="w-20 h-20 bg-black border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  <img
                    src="/logo_blink.svg"
                    alt="Success"
                    className="w-10 h-10"
                  />
                </div>
                <h2 className="text-4xl md:text-5xl font-display leading-tight">
                  C'est prêt !
                </h2>
                <p className="text-sm text-white/40 px-8">
                  Votre événement <span className="text-white">"{name}"</span> a
                  été créé. Partagez ce code avec vos invités.
                </p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-white/5 rounded-2xl blur-xl transition-opacity" />
                <div className="relative bg-white p-4 rounded-xl shadow-2xl">
                  <img
                    src="/mock_qr_code_blink_1778950106803.png"
                    alt="QR Code"
                    className="w-40 h-40 md:w-48 md:h-48 object-contain"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/join/${slug}`,
                    );
                    toast.success("Lien copié dans le presse-papier !");
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-colors"
                >
                  Copier le lien
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toast.success("QR Code enregistré avec succès !")
                  }
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-colors"
                >
                  Enregistrer QR
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto pt-8">
        {/* Step Indicator above the border */}
        <div className="flex justify-center items-center mb-8">
          <div className="flex gap-2 items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={clsx(
                  "w-1.5 h-1.5 rounded-full transition-all duration-500",
                  s === createStep
                    ? "bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    : s < createStep
                      ? "bg-white/40"
                      : "bg-white/10",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-white/5 pt-8">
          <div className="w-24">
            {createStep > 1 && createStep < 5 && (
              <button
                type="button"
                onClick={() => setCreateStep(createStep - 1)}
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 transition-colors py-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Retour
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              if (createStep < 4) {
                if (createStep === 1 && !name) return setError("Nom requis");
                if (createStep === 2) {
                  if (!slug) return setError("Code requis");
                  if (slug.length < 4) return setError("Minimum 4 caractères");
                  if (slug.length > 16)
                    return setError("Maximum 16 caractères");
                }
                if (createStep === 3 && !endDateTime)
                  return setError("Date requise");
                setError("");
                setCreateStep((prev) => prev + 1);
              } else if (createStep === 4) {
                handleCreateStep4Submit(e);
              } else {
                router.push(`/event/${slug}/gallery`);
              }
            }}
            disabled={isLoading}
            className="btn-once-primary !px-8 !h-[50px] group"
          >
            {isLoading
              ? "..."
              : createStep === 4
                ? "Créer"
                : createStep === 5
                  ? "Accéder"
                  : "Suivant"}
            <MoveRight className="w-4 h-4 transition-transform" />
          </button>
        </div>
      </div>
    </motion.form>
  );
}
