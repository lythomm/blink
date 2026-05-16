import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPhotos = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("photos")
      .withIndex("by_event_and_guest", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();
  },
});

export const getRemainingPoses = query({
  args: { eventId: v.string(), guestId: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.eventId))
      .unique();

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
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.eventId))
      .unique();

    const existingPhotos = await ctx.db
      .query("photos")
      .withIndex("by_event_and_guest", (q) =>
        q.eq("eventId", args.eventId).eq("guestId", args.guestId)
      )
      .collect();

    const limit = event?.maxPhotosPerParticipant ?? 10;
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

export const deletePhoto = mutation({
  args: {
    id: v.id("photos"),
    guestId: v.string(),
  },
  handler: async (ctx, args) => {
    const photo = await ctx.db.get(args.id);
    if (!photo) throw new Error("Photo not found");
    if (photo.guestId !== args.guestId) {
      throw new Error("Unauthorized: You can only delete your own photos.");
    }
    await ctx.db.delete(args.id);
    return photo.cloudinaryId;
  },
});
