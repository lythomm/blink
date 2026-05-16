import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getEventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug.toLowerCase()))
      .unique();
  },
});

export const getEvent = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createEvent = mutation({
  args: { 
    name: v.string(), 
    slug: v.string(), 
    endsAt: v.number(),
    maxPhotosPerParticipant: v.number() 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Vous devez être connecté pour créer un événement.");
    }

    const slug = args.slug.toLowerCase().trim().replace(/\s+/g, "-");
    
    // Check if slug already exists
    const existing = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    
    if (existing) {
      throw new Error("Cet identifiant d'événement est déjà utilisé.");
    }

    const now = Date.now();
    if (args.endsAt <= now) {
      throw new Error("La date de fin ne peut pas être dans le passé.");
    }

    return await ctx.db.insert("events", {
      name: args.name,
      slug,
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
        q.eq("eventId", args.eventId).eq("guestId", args.guestId)
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
