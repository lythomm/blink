"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v2 as cloudinary } from "cloudinary";

export const deletePhotoSecure = action({
  args: { 
    photoId: v.id("photos"), 
    guestId: v.string() 
  },
  handler: async (ctx, args) => {
    // 1. Get the authenticated user (creator) if any
    const userId = await getAuthUserId(ctx);

    // 2. Fetch the photo from database internally
    const photo = await ctx.runQuery(internal.photos.getPhotoInternal, { id: args.photoId });
    if (!photo) {
      throw new Error("Photo introuvable.");
    }

    // 3. Fetch the event to check if the caller is the creator
    const event = await ctx.runQuery(api.events.getEventById, { id: photo.eventId });

    // 4. Validate ownership:
    // Caller is authorized if they are the photo guest uploader OR the event creator
    const isOwner = photo.guestId === args.guestId;
    const isCreator = userId !== null && event !== null && event.creatorId === userId;

    if (!isOwner && !isCreator) {
      throw new Error("Non autorisé : vous ne pouvez pas supprimer cette photo.");
    }

    // 5. Delete the photo from the database first
    await ctx.runMutation(internal.photos.deletePhotoInternal, { id: args.photoId });

    // 6. Delete the file from Cloudinary
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
      await cloudinary.uploader.destroy(photo.cloudinaryId);
      return { success: true };
    } catch (error) {
      console.error("Cloudinary destroy failed:", error);
      // We still return true because the database reference was successfully cleaned up
      return { success: true, cloudinaryError: true };
    }
  },
});
