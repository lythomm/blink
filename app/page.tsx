"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MoveRight, ScanLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { getGuestId } from "@/app/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"join" | "create">("join");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Auth state
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [authStep, setAuthStep] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");

  const existingEvent = useQuery(api.events.getEventBySlug, { slug });
  const joinMutation = useMutation(api.events.joinEvent);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signIn("password", {
        email,
        password,
        flow: authStep,
        name: userName,
      });
      // Redirect happens in useEffect
    } catch (err: any) {
      setError("Identifiants incorrects ou erreur serveur.");
      setIsLoading(false);
    }
  };

  const handleJoinDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setIsLoading(true);
    if (existingEvent) {
      await joinMutation({
        eventId: existingEvent.slug,
        guestId: getGuestId(),
      });
      router.push(`/event/${existingEvent.slug}/gallery`);
    } else {
      setError("Événement introuvable.");
      setIsLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <main className="flex-1 flex flex-col items-center justify-center h-dvh px-6 relative overflow-hidden bg-neutral">
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
            onClick={() => {
              setMode("join");
              setError("");
            }}
            className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${mode === "join" ? "text-white" : "text-white/20"}`}
          >
            Rejoindre
          </button>
          <button
            onClick={() => {
              setMode("create");
              setError("");
            }}
            className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${mode === "create" ? "text-white" : "text-white/20"}`}
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
                  placeholder="Code"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="blink-input !h-20 !text-3xl font-display uppercase tracking-widest text-center"
                />
                {error && (
                  <p className="absolute -bottom-6 left-0 right-0 text-[10px] text-red-500 font-bold uppercase tracking-widest">
                    {error}
                  </p>
                )}
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
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleAuth}
              className="space-y-6"
            >
              <div className="space-y-4">
                {authStep === "signUp" && (
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="blink-input text-center"
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="blink-input text-center"
                  required
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="blink-input text-center"
                  required
                />
              </div>

              {error && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-once-primary flex items-center gap-3 mx-auto"
                >
                  {isLoading
                    ? "Chargement..."
                    : authStep === "signIn"
                      ? "Se connecter"
                      : "Créer un compte"}
                  <MoveRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAuthStep(authStep === "signIn" ? "signUp" : "signIn")
                  }
                  className="text-[10px] uppercase tracking-[0.2em] text-white/40 transition-colors"
                >
                  {authStep === "signIn"
                    ? "Pas encore de compte ? S'inscrire"
                    : "Déjà un compte ? Se connecter"}
                </button>
              </div>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-1">
              Limite 50
            </p>
            <p className="text-[10px] text-secondary font-medium tracking-wide">
              Poses par invité
            </p>
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-1">
              Temps Réel
            </p>
            <p className="text-[10px] text-secondary font-medium tracking-wide">
              Galerie collective
            </p>
          </div>
        </motion.div>
      </div>

      <footer className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold tracking-[0.5em] text-white/10 whitespace-nowrap">
        Blink — Système Film Unique v1.1
      </footer>
    </main>
  );
}
