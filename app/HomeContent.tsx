"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ScanLine, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getGuestId } from "@/app/lib/utils";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Modal } from "./components/Modal";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

export default function HomeContent() {
  const router = useRouter();
  const [eventId, setEventId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Auth state
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [createStep, setCreateStep] = useState(1);

  // Login modal states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginFlow, setLoginFlow] = useState<"signIn" | "signUp" | "verify">(
    "signIn",
  );
  const [otpCode, setOtpCode] = useState("");
  const [loginError, setLoginError] = useState("");

  const existingEvent = useQuery(api.events.getEventById, { id: eventId });
  const joinMutation = useMutation(api.events.joinEvent);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  // Clear errors when inputs change
  useEffect(() => {
    setError("");
  }, [eventId]);

  useEffect(() => {
    setLoginError("");
  }, [loginEmail, loginPassword, loginName]);

  const handleJoinDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setIsLoading(true);
    if (existingEvent) {
      await joinMutation({
        eventId: existingEvent._id,
        guestId: getGuestId(),
      });
      router.push(`/event/${existingEvent._id}/gallery`);
    } else {
      setError("Événement introuvable.");
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginFlow === "verify") {
      if (!otpCode) {
        setLoginError("Veuillez saisir le code.");
        return;
      }
      setIsLoading(true);
      setLoginError("");
      try {
        await signIn("password", {
          email: loginEmail,
          code: otpCode,
          flow: "email-verification",
        });
        setIsLoginOpen(false);
        setLoginEmail("");
        setLoginPassword("");
        setLoginName("");
        setOtpCode("");
        setLoginFlow("signIn");
        setLoginError("");
        setIsLoading(false);
      } catch (err: any) {
        setLoginError("Code incorrect ou expiré.");
        setIsLoading(false);
      }
      return;
    }

    if (!loginEmail || !loginPassword) {
      setLoginError("Veuillez remplir tous les champs.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      setLoginError("Veuillez saisir une adresse email valide.");
      return;
    }
    if (loginPassword.length < 8) {
      setLoginError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    setIsLoading(true);
    setLoginError("");
    try {
      let result;
      if (loginFlow === "signIn") {
        result = await signIn("password", {
          email: loginEmail,
          password: loginPassword,
          flow: "signIn",
        });
      } else {
        const signUpArgs: any = {
          email: loginEmail,
          password: loginPassword,
          flow: "signUp",
        };
        if (loginName) {
          signUpArgs.name = loginName;
        }
        result = await signIn("password", signUpArgs);
      }

      if (!result.signingIn) {
        setLoginFlow("verify");
      } else {
        setIsLoginOpen(false);
        setLoginEmail("");
        setLoginPassword("");
        setLoginName("");
        setLoginFlow("signIn");
        setLoginError("");
      }
      setIsLoading(false);
    } catch (err: any) {
      const msg = err.message || "";
      if (
        msg.includes("Invalid password") ||
        msg.includes("Invalid credentials")
      ) {
        setLoginError("Email ou mot de passe incorrect.");
      } else if (msg.includes("already")) {
        setLoginError("L'email est déjà utilisé.");
      } else if (msg.includes("Failed to send OTP email")) {
        setLoginError(
          "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard.",
        );
      } else if (msg.includes("InvalidAccountId")) {
        setLoginError("Aucun compte valide trouvé avec ces identifiants.");
      } else {
        if (loginFlow === "signIn") {
          setLoginError("Email ou mot de passe incorrect.");
        } else {
          setLoginError(
            "Impossible de créer le compte. L'email est peut-être déjà utilisé.",
          );
        }
      }
      setIsLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <main className="flex-1 flex flex-col items-center justify-center h-dvh px-6 relative overflow-hidden bg-neutral">
      <div className="grain-overlay z-10" />
      <div className="cinematic-overlay absolute inset-0 z-20" />

      {/* Navigation Bar */}
      <header className="absolute top-6 left-0 right-0 px-6 max-w-5xl mx-auto flex justify-between items-center z-40">
        <div className="flex items-center gap-3">
          <img
            src="/logo_blink.svg"
            alt="Blink"
            className="w-6 h-6 opacity-85"
          />
          <span className="text-xl font-display tracking-tight text-white/90">
            blink.
          </span>
        </div>
        <div>
          {isAuthenticated ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="text-[10px] uppercase tracking-widest font-bold text-white hover:text-white transition-colors bg-white/5 border border-white/5 hover:border-white/10 rounded-full px-4 py-2 cursor-pointer"
            >
              Tableau de bord
            </button>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="text-[10px] uppercase tracking-widest font-bold text-white hover:text-white transition-colors bg-white/5 border border-white/5 hover:border-white/10 rounded-full px-4 py-2 cursor-pointer"
            >
              Se connecter
            </button>
          )}
        </div>
      </header>

      <div className="w-full max-w-xl relative z-30 space-y-12 text-center">
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

        <motion.div
          key="join-container"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 max-w-sm mx-auto w-full"
        >
          {/* Formulaire Rejoindre */}
          <form onSubmit={handleJoinDirect} className="space-y-6">
            <div className="relative group">
              <input
                type="text"
                placeholder="Identifiant de l'événement"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="blink-input !h-20 !text-[15px] font-body uppercase tracking-wider text-center"
              />
              {error && (
                <p className="absolute -bottom-6 left-0 right-0 text-[10px] text-red-500 font-bold uppercase tracking-widest">
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !eventId}
              className="btn-once-primary flex items-center gap-3 w-full justify-center cursor-pointer"
            >
              {isLoading ? "Vérification..." : "Accéder à la galerie"}
              <ScanLine className="w-4 h-4" />
            </button>
          </form>

          {/* Séparateur */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="w-full border-t border-white/10" />
            <span className="absolute bg-neutral px-4 text-[10px] uppercase tracking-[0.3em] font-bold text-white/20">
              OU
            </span>
          </div>

          {/* Bouton Organiser */}
          <button
            type="button"
            onClick={() => {
              setLoginFlow("signUp");
              setIsLoginOpen(true);
            }}
            className="inline-flex items-center justify-center gap-3 px-8 py-5 text-sm uppercase tracking-widest font-bold text-neutral bg-white hover:bg-neutral-200 transition-all rounded-2xl shadow-xl w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            Créer un événement
          </button>
        </motion.div>
      </div>

      {/* Login Modal */}
      <Modal
        isOpen={isLoginOpen}
        onClose={() => {
          if (!isLoading) {
            setIsLoginOpen(false);
            setLoginEmail("");
            setLoginPassword("");
            setLoginName("");
            setLoginFlow("signIn");
            setLoginError("");
          }
        }}
        maxWidth="md"
      >
        <form onSubmit={handleLoginSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <h2 className="text-3xl font-display text-white">
              {loginFlow === "verify"
                ? "Vérification"
                : loginFlow === "signIn"
                  ? "Se connecter"
                  : "S'inscrire"}
            </h2>
            <p className="text-xs text-white/40 leading-relaxed">
              {loginFlow === "verify"
                ? `Un code a été envoyé à ${loginEmail}. Veuillez le saisir ci-dessous.`
                : loginFlow === "signIn"
                  ? ""
                  : "Créez votre compte Blink en quelques instants pour organiser vos événements."}
            </p>
          </div>

          <div className="space-y-4">
            {loginFlow === "verify" ? (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">
                  Code à 6 chiffres
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={isLoading}
                  className="blink-input w-full text-center tracking-[0.5em] text-2xl font-display"
                  required
                  maxLength={6}
                />
              </div>
            ) : (
              <>
                {loginFlow === "signUp" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">
                      Prénom
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Thomas"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      disabled={isLoading}
                      className="blink-input w-full"
                      required
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                    className="blink-input w-full"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isLoading}
                    className="blink-input w-full"
                    required
                  />
                </div>
              </>
            )}

            {loginError && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                {loginError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              isLoading ||
              (loginFlow === "verify"
                ? !otpCode
                : !loginEmail || !loginPassword)
            }
            className="btn-once-primary w-full justify-center cursor-pointer"
          >
            {isLoading
              ? "Chargement..."
              : loginFlow === "verify"
                ? "Vérifier le code"
                : loginFlow === "signIn"
                  ? "Se connecter"
                  : "Créer un compte"}
          </button>

          {loginFlow !== "verify" && (
            <div className="text-center pt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setLoginFlow(loginFlow === "signIn" ? "signUp" : "signIn");
                  setLoginError("");
                }}
                className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                {loginFlow === "signIn" ? (
                  <>
                    Pas encore de compte ?{" "}
                    <span className="text-white underline">S'inscrire</span>
                  </>
                ) : (
                  <>
                    Déjà un compte ?{" "}
                    <span className="text-white underline">Se connecter</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </Modal>

      <PWAInstallBanner />
    </main>
  );
}
