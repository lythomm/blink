"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MoveRight, Plus, ScanLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { getGuestId } from "@/app/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"join" | "create">("join");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [maxPhotos, setMaxPhotos] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const existingEvent = useQuery(api.events.getEventBySlug, { slug });

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Initialize endDateTime to 2 hours from now if empty
    if (mode === "create" && !endDateTime) {
      const now = new Date();
      now.setHours(now.getHours() + 2);
      setEndDateTime(now.toISOString().slice(0, 16));
    }

    if (mode === "join") {
      if (!slug) return;
      setIsLoading(true);
      if (existingEvent) {
        router.push(`/event/${existingEvent.slug}`);
      } else {
        setError("Cet événement n'existe pas.");
        setIsLoading(false);
      }
    } else {
      if (!name || !slug) return;
      setIsLoading(true);
      try {
        const createEvent = useMutation(api.events.createEvent);
        // Note: Mutations must be called at the top level or via useMutation
        // I will use a direct mutation call if I can, but I need to use the hook.
      } catch (err: any) {
        setError(err.message || "Erreur lors de la création.");
        setIsLoading(false);
      }
    }
  };

  // We need to move useMutation to top level
  const createMutation = useMutation(api.events.createEvent);
  const joinMutation = useMutation(api.events.joinEvent);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (!endDateTime) {
      setError("Veuillez définir une date de fin.");
      return;
    }

    const endsAt = new Date(endDateTime).getTime();
    if (endsAt <= Date.now()) {
      setError("La date de fin doit être dans le futur.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await createMutation({ name, slug, endsAt, maxPhotosPerParticipant: maxPhotos });
      await joinMutation({ eventId: slug, guestId: getGuestId() });
      router.push(`/event/${slug.toLowerCase().trim().replace(/\s+/g, "-")}/gallery`);
    } catch (err: any) {
      // Extract specific error message from Convex if possible
      const errorMessage = err.message || "";
      if (errorMessage.includes("déjà utilisé")) {
        setError("Ce code d'événement est déjà utilisé.");
      } else if (errorMessage.includes("dans le passé")) {
        setError("La date de fin ne peut pas être dans le passé.");
      } else {
        setError("Une erreur est survenue lors de la création.");
      }
      setIsLoading(false);
    }
  };

  const handleJoinDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setIsLoading(true);
    if (existingEvent) {
      await joinMutation({ eventId: existingEvent.slug, guestId: getGuestId() });
      router.push(`/event/${existingEvent.slug}/gallery`);
    } else {
      setError("Événement introuvable.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] px-6 relative overflow-hidden bg-neutral">
      <div className="grain-overlay z-10" />
      <div className="cinematic-overlay absolute inset-0 z-20" />
      
      <div className="w-full max-w-xl space-y-12 text-center relative z-30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="space-y-4"
        >
          <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-white/40">
            Expérience Film Numérique
          </span>
          <h1 className="text-7xl font-display leading-none">Blink.</h1>
        </motion.div>

        {/* Mode Selector */}
        <div className="flex justify-center gap-8 mb-4">
          <button 
            onClick={() => { setMode("join"); setError(""); }}
            className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${mode === "join" ? "text-tertiary" : "text-white/20 hover:text-white/40"}`}
          >
            Rejoindre
          </button>
          <button 
            onClick={() => { setMode("create"); setError(""); }}
            className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${mode === "create" ? "text-tertiary" : "text-white/20 hover:text-white/40"}`}
          >
            Organiser
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === "join" ? (
            <motion.form
              key="join"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleJoinDirect}
              className="space-y-8"
            >
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Code de l'événement"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full h-20 bg-transparent border-b border-white/5 text-center text-3xl font-display placeholder:text-white/5 focus:outline-none focus:border-tertiary transition-all duration-500 uppercase tracking-widest"
                />
                {error && <p className="absolute -bottom-6 left-0 right-0 text-[10px] text-red-500 font-bold uppercase tracking-widest">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading || !slug}
                className="btn-once-primary flex items-center gap-3 mx-auto"
              >
                {isLoading ? "Vérification..." : "Accéder à la galerie"}
                <ScanLine className="w-4 h-4" />
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleCreate}
              className="space-y-6"
            >
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nom (ex: Mariage d'Alice)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-14 bg-transparent border-b border-white/5 text-center text-xl font-display placeholder:text-white/5 focus:outline-none focus:border-white/20 transition-all"
                />
                <input
                  type="text"
                  placeholder="Code unique (ex: alice-2026)"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full h-14 bg-transparent border-b border-white/5 text-center text-xl font-display placeholder:text-white/5 focus:outline-none focus:border-white/20 transition-all uppercase tracking-widest"
                />
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Date et heure de fin</p>
                <div className="relative group">
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className={clsx(
                      "w-full h-14 bg-transparent border-b border-white/5 text-center text-xl font-display",
                      "focus:outline-none focus:border-white/20 transition-all text-white invert-calendar-icon",
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Limite de photos par personne</p>
                <div className="flex justify-center gap-4">
                  {[5, 10, 25, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMaxPhotos(val)}
                      className={clsx(
                        "w-12 h-12 rounded-2xl border flex items-center justify-center text-sm font-bold transition-all",
                        maxPhotos === val 
                          ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                          : "bg-transparent border-white/10 text-white/40 hover:border-white/30"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{error}</p>}
              <button
                type="submit"
                disabled={isLoading || !name || !slug}
                className="btn-once-primary flex items-center gap-3 mx-auto"
              >
                {isLoading ? "Création..." : "Créer l'événement"}
                <Plus className="w-4 h-4" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex justify-center gap-12 pt-8 opacity-40"
        >
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-1">Limite 50</p>
            <p className="text-[10px] text-secondary font-medium tracking-wide">Poses par invité</p>
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-1">Temps Réel</p>
            <p className="text-[10px] text-secondary font-medium tracking-wide">Galerie collective</p>
          </div>
        </motion.div>
      </div>

      <footer className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold tracking-[0.5em] text-white/10 whitespace-nowrap">
        Blink — Système Film Unique v1.1
      </footer>
    </main>
  );
}
