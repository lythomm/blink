import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getPhotos = query({
  args: { 
    eventId: v.string(),
    clientGuestId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_event_and_guest", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();

    return Promise.all(
      photos.map(async (photo) => {
        const participant = await ctx.db
          .query("participants")
          .withIndex("by_event_and_guest", (q) =>
            q.eq("eventId", args.eventId).eq("guestId", photo.guestId)
          )
          .unique();
        
        const { guestId, ...restPhoto } = photo;
        return {
          ...restPhoto,
          isOwnPhoto: guestId === args.clientGuestId,
          authorName: participant?.name || "Invité mystère",
        };
      })
    );
  },
});

export const getRemainingPoses = query({
  args: { eventId: v.string(), guestId: v.string() },
  handler: async (ctx, args) => {
    const eventIdNormalized = ctx.db.normalizeId("events", args.eventId);
    const event = eventIdNormalized ? await ctx.db.get(eventIdNormalized) : null;

    const photos = await ctx.db
      .query("photos")
      .withIndex("by_event_and_guest", (q) =>
        q.eq("eventId", args.eventId).eq("guestId", args.guestId)
      )
      .collect();

    const limit = event?.maxPhotosPerParticipant ?? 10;
    return Math.max(0, limit - photos.length);
  },
});

export const takePhoto = mutation({
  args: {
    eventId: v.string(),
    guestId: v.string(),
    cloudinaryId: v.string(),
  },
  handler: async (ctx, args) => {
    const eventIdNormalized = ctx.db.normalizeId("events", args.eventId);
    const event = eventIdNormalized ? await ctx.db.get(eventIdNormalized) : null;
    if (!event) {
      throw new Error("Événement introuvable.");
    }

    const existingPhotos = await ctx.db
      .query("photos")
      .withIndex("by_event_and_guest", (q) =>
        q.eq("eventId", args.eventId).eq("guestId", args.guestId)
      )
      .collect();

    const limit = event.maxPhotosPerParticipant;
    if (existingPhotos.length >= limit) {
      throw new Error(`Quota atteint : ${limit} photos maximum.`);
    }

    return await ctx.db.insert("photos", {
      eventId: args.eventId,
      guestId: args.guestId,
      cloudinaryId: args.cloudinaryId,
      createdAt: Date.now(),
    });
  },
});

export const getPhotoInternal = internalQuery({
  args: { id: v.id("photos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const deletePhotoInternal = internalMutation({
  args: { id: v.id("photos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

