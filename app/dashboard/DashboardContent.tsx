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
  Clock,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Image from "next/image";
import CreateEventForm from "./CreateEventForm";
import { prettyDisplayDate } from "@/app/lib/utils";

const formatTimeLeft = (endsAt: number) => {
  const diff = endsAt - Date.now();
  if (diff <= 0) return "Terminé";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return `Fin dans ${hours} heure${hours > 1 ? "s" : ""}`;
  }
  const days = Math.floor(hours / 24);
  return `Fin dans ${days} jour${days > 1 ? "s" : ""}`;
};

export default function DashboardContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [view, setView] = useState<"dashboard" | "create">("dashboard");
  const [createStep, setCreateStep] = useState(1);

  const user = useQuery(api.users.current);
  const userEvents = useQuery(api.events.listUserEvents);

  const now = Date.now();
  const activeEvents = userEvents?.filter((e) => e.endsAt > now) || [];
  const pastEvents = userEvents?.filter((e) => e.endsAt <= now) || [];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return null;

  return (
    <main className="flex-1 flex flex-col items-center h-dvh px-6 py-8 relative overflow-hidden bg-neutral">
      <div className="grain-overlay fixed inset-0 z-10 pointer-events-none" />
      <div className="cinematic-overlay fixed inset-0 z-20 pointer-events-none" />

      <div className="w-full max-w-xl flex-1 flex flex-col relative z-30">
        {view === "dashboard" && (
          <header className="flex justify-between items-center mb-12 h-10">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <img src="/logo_blink.svg" alt="Blink" className="w-8 h-8" />
              <h1 className="text-3xl font-display leading-none">Blink.</h1>
            </motion.div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                <UserIcon className="w-3 h-3 text-white" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">
                  {user?.name || user?.email}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 bg-white/5 rounded-full border border-white/5 text-red-500/60 transition-colors"
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
              className="space-y-6 flex flex-col overflow-hidden w-full h-full pb-24 overflow-y-auto hide-scrollbar"
            >
              {userEvents && userEvents.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center py-12 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] text-center mt-8">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Aucun événement
                  </p>
                  <button
                    onClick={() => setView("create")}
                    className="mt-4 text-white text-[10px] uppercase tracking-widest font-bold"
                  >
                    Créer votre premier événement
                  </button>
                </div>
              ) : (
                <>
                  {/* ACTIVE Section */}
                  {activeEvents.length > 0 && (
                    <div className="mb-8">
                      <p className="text-sm uppercase tracking-[0.2em] font-medium text-white/40 mb-4">
                        EN COURS
                      </p>
                      <div className="flex overflow-x-auto gap-2 pb-4 px-2 snap-x -mx-2 hide-scrollbar">
                        {activeEvents.map((event) => {
                          const timeLeftStr = formatTimeLeft(event.endsAt);
                          const bgImage = event.previews?.[0];

                          return (
                            <button
                              key={event._id}
                              onClick={() =>
                                router.push(`/event/${event.slug}/gallery`)
                              }
                              className="relative min-w-[200px] w-[200px] h-[280px] rounded-3xl overflow-hidden snap-center flex-shrink-0 text-left group border border-white/5"
                            >
                              {bgImage ? (
                                <Image
                                  src={bgImage}
                                  width={400}
                                  height={560}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  alt=""
                                />
                              ) : (
                                <div className="absolute inset-0 bg-neutral" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60" />

                              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-xl font-display text-white mb-1 leading-tight">
                                    {event.name}
                                  </h3>
                                  <div className="flex items-center gap-1.5 text-white/60">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px] font-medium tracking-wide">
                                      {timeLeftStr}
                                    </span>
                                  </div>
                                </div>

                                <div className="self-end bg-black/50 backdrop-blur-md p-3 rounded-2xl transition-colors">
                                  <Camera className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ALBUMS Section */}
                  {pastEvents.length > 0 && (
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] font-medium text-white/40 mb-4">
                        ALBUMS
                      </p>
                      <div className="flex flex-col gap-8">
                        {pastEvents.map((event) => {
                          const previews = event.previews || [];
                          const dateStr = prettyDisplayDate(
                            new Date(event._creationTime).toISOString(),
                            {
                              showWeekday: false,
                              showTime: false,
                            },
                          );

                          return (
                            <button
                              key={event._id}
                              onClick={() =>
                                router.push(`/event/${event.slug}/gallery`)
                              }
                              className="group text-left w-full"
                            >
                              <div className="flex justify-between items-baseline mb-4">
                                <h3 className="text-xl font-display text-white transition-colors">
                                  {event.name}
                                </h3>
                                <span className="text-[10px] font-medium text-white/40">
                                  {dateStr}
                                </span>
                              </div>

                              <div className="flex -space-x-6 h-32 relative px-2">
                                {previews.slice(0, 3).map((pid, idx) => (
                                  <div
                                    key={idx}
                                    className={`relative flex-1 rounded-2xl overflow-hidden ${
                                      idx === 0
                                        ? "-rotate-2"
                                        : idx === 1
                                          ? "rotate-2"
                                          : "-rotate-1"
                                    } origin-bottom transition-transform duration-300`}
                                  >
                                    <Image
                                      src={pid}
                                      width={200}
                                      height={200}
                                      className="absolute inset-0 w-full h-full object-cover"
                                      alt=""
                                    />
                                  </div>
                                ))}
                                {previews.length >= 4 && (
                                  <div className="relative flex-1 rounded-2xl overflow-hidden rotate-2 origin-bottom transition-transform duration-300">
                                    <Image
                                      src={previews[3]}
                                      width={200}
                                      height={200}
                                      className="absolute inset-0 w-full h-full object-cover blur-sm brightness-50"
                                      alt=""
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-white font-medium text-sm">
                                        + {event.photoCount - 3}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {previews.length === 0 && (
                                  <div className="w-full h-full rounded-2xl bg-white/5 flex items-center justify-center border border-dashed border-white/10">
                                    <span className="text-white/20 text-[10px] uppercase tracking-widest font-bold">
                                      Aucune photo
                                    </span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
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
