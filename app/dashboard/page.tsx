"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Plus,
  ArrowLeft,
  LogOut,
  User as UserIcon,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import CreateEventForm from "./CreateEventForm";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [view, setView] = useState<"dashboard" | "create">("dashboard");
  const [createStep, setCreateStep] = useState(1);

  const user = useQuery(api.users.current);
  const userEvents = useQuery(api.events.listUserEvents);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return null;

  return (
    <main className="flex-1 flex flex-col items-center h-dvh px-6 pt-16 pb-12 relative overflow-hidden bg-neutral">
      <div className="grain-overlay fixed inset-0 z-10 pointer-events-none" />
      <div className="cinematic-overlay fixed inset-0 z-20 pointer-events-none" />

      <div className="w-full max-w-xl flex-1 flex flex-col relative z-30">
        {view === "dashboard" && (
          <header className="flex justify-between items-center mb-12 h-10">
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-display leading-none"
            >
              Blink.
            </motion.h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                <UserIcon className="w-3 h-3 text-white" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">
                  {user?.name || user?.email}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 bg-white/5 rounded-full border border-white/5 text-red-500/60 hover:text-red-500 transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          </header>
        )}

        <AnimatePresence mode="wait">
          {view === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 flex flex-col overflow-hidden w-full"
            >
              <div className="flex flex-col items-center gap-2 mb-8">
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20">
                  Vos Événements
                </span>
                <div className="h-px w-12 bg-white/10" />
              </div>

              {userEvents && userEvents.length > 0 ? (
                <div className="grid gap-4 px-2 overflow-y-auto -mx-2 pb-24">
                  {userEvents.map((event) => (
                    <button
                      key={event._id}
                      onClick={() =>
                        router.push(`/event/${event.slug}/gallery`)
                      }
                      className="group relative w-full p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-left hover:bg-white/[0.05] hover:border-white/30 transition-all duration-500"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-display group-hover:text-white transition-colors">
                          {event.name}
                        </h3>
                        <span className="text-[8px] uppercase tracking-widest font-bold text-white/20 group-hover:text-white/40 transition-colors">
                          {event.slug}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 opacity-40">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          <span className="text-[10px] font-bold tracking-widest">
                            {event.participantCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ImageIcon className="w-3 h-3" />
                          <span className="text-[10px] font-bold tracking-widest">
                            {event.photoCount}
                          </span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-[9px] uppercase tracking-widest font-medium opacity-60">
                            {new Date(event.endsAt).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center py-12 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Aucun événement actif
                  </p>
                  <button
                    onClick={() => setView("create")}
                    className="mt-4 text-white text-[10px] uppercase tracking-widest font-bold hover:underline"
                  >
                    Créer votre premier événement
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <CreateEventForm
              createStep={createStep}
              setCreateStep={setCreateStep}
              onCancel={() => setView("dashboard")}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      {view === "dashboard" && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setCreateStep(1);
            setView("create");
          }}
          className="fixed bottom-10 left-6 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] z-50 text-neutral"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      )}
    </main>
  );
}
