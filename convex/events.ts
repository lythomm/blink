import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getEvent = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getEventById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("events", args.id);
    if (!normalizedId) return null;
    return await ctx.db.get(normalizedId);
  },
});

export const createEvent = mutation({
  args: {
    name: v.string(),
    endsAt: v.number(),
    maxPhotosPerParticipant: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Vous devez être connecté pour créer un événement.");
    }

    const now = Date.now();
    if (args.endsAt <= now) {
      throw new Error("La date de fin ne peut pas être dans le passé.");
    }

    return await ctx.db.insert("events", {
      name: args.name,
      createdAt: now,
      endsAt: args.endsAt,
      maxPhotosPerParticipant: args.maxPhotosPerParticipant,
      creatorId: userId,
    });
  },
});

export const joinEvent = mutation({
  args: { eventId: v.string(), guestId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_event_and_guest", (q) =>
        q.eq("eventId", args.eventId).eq("guestId", args.guestId),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("participants", {
        eventId: args.eventId,
        guestId: args.guestId,
        joinedAt: Date.now(),
      });
    }
  },
});

export const getParticipantCount = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    return participants.length;
  },
});

export const listUserEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const events = await ctx.db
      .query("events")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .order("desc")
      .collect();

    return await Promise.all(
      events.map(async (event) => {
        const photos = await ctx.db
          .query("photos")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .order("desc")
          .collect();

        const participants = await ctx.db
          .query("participants")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();

        return {
          ...event,
          photoCount: photos.length,
          participantCount: participants.length,
          previews: photos.slice(0, 4).map(p => p.cloudinaryId),
        };
      }),
    );
  },
});

export const updateParticipantName = mutation({
  args: { eventId: v.string(), guestId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_event_and_guest", (q) =>
        q.eq("eventId", args.eventId).eq("guestId", args.guestId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { name: args.name });
    }
  },
});

export const getParticipant = query({
  args: { eventId: v.string(), guestId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("participants")
      .withIndex("by_event_and_guest", (q) =>
        q.eq("eventId", args.eventId).eq("guestId", args.guestId),
      )
      .unique();
  },
});
