"use client";

import { useEffect, useState } from "react";
import { X, Share, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallBanner() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(true); // Default to true to prevent layout shift/flash before checking client-side storage

  useEffect(() => {
    // 1. Check if already dismissed
    const isDismissed = localStorage.getItem("blink_pwa_dismissed") === "true";

    // 2. Check if already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isDismissed || isStandalone) {
      setDismissed(true);
      return;
    }

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(detectIOS);

    // Disable the popup on iOS for now
    /*
    if (detectIOS) {
      setIsInstallable(true);
      setDismissed(false);
      return;
    }
    */

    // 4. Listen for beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      setDismissed(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as any,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as any,
      );
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      localStorage.setItem("blink_pwa_dismissed", "true");
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("blink_pwa_dismissed", "true");
    setDismissed(true);
  };

  if (dismissed || !isInstallable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50 text-white flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold tracking-wide text-white">
              📲 Installer Blink
            </h3>
            <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
              Ajoutez l&apos;app sur votre écran d&apos;accueil pour capturer et
              partager vos souvenirs instantanément.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 h-9 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Installer
          </button>
        </div>

        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-t border-white/10 pt-3 mt-1 text-[11px] text-white/80 space-y-2.5"
          >
            <p className="font-semibold text-white/90">
              Pour l&apos;installer sur iOS :
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-white/70">
              <li>
                Appuyez sur le bouton de partage{" "}
                <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> dans
                Safari.
              </li>
              <li>
                Sélectionnez l&apos;option{" "}
                <span className="font-semibold text-white/95">
                  &quot;Sur l&apos;écran d&apos;accueil&quot;
                </span>
                .
              </li>
            </ol>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
