"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User } from "lucide-react";
import { Modal } from "./Modal";

interface GuestNameModalProps {
  eventId: string;
  guestId: string;
}

export function GuestNameModal({ eventId, guestId }: GuestNameModalProps) {
  const event = useQuery(api.events.getEventById, { id: eventId });
  const participant = useQuery(api.events.getParticipant, { eventId, guestId });
  const updateNameMutation = useMutation(api.events.updateParticipantName);
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Show modal if participant exists but has no name
    if (
      participant !== undefined &&
      participant !== null &&
      !participant.name
    ) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [participant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateNameMutation({ eventId, guestId, name: name.trim() });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update name:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen}>
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2">
          <User className="w-8 h-8 text-black" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-display text-white">Bienvenue !</h2>
          <p className="text-white/50 text-sm">
            Pour que l'on sache qui a pris les photos, merci de renseigner ton prénom.
          </p>
          <p className="text-white/50 text-sm">
            Ton appareil contient{" "}
            <span className="text-white font-bold">
              {event?.maxPhotosPerParticipant || "..."} photos
            </span>{" "}
            à ne pas rater !
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ton prénom"
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white placeholder:text-white/20 outline-none focus:border-white/40 focus:bg-white/10 transition-all text-center"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full h-14 bg-white text-black font-medium rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              "C'est parti"
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
}
