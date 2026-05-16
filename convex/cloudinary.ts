"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { v2 as cloudinary } from "cloudinary";

export const deleteFromCloudinary = action({
  args: { cloudinaryId: v.string() },
  handler: async (ctx, args) => {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
      await cloudinary.uploader.destroy(args.cloudinaryId);
      return { success: true };
    } catch (error) {
      console.error("Cloudinary destroy failed:", error);
      return { success: false };
    }
  },
});
