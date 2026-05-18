import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const generateOtp = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    // 1. Delete old OTPs for this email
    const existing = await ctx.db
      .query("otps")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const record of existing) {
      await ctx.db.delete(record._id);
    }

    // 2. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    // 3. Store OTP
    await ctx.db.insert("otps", {
      email,
      code,
      expiresAt,
    });

    return code;
  },
});

export const verifyOtp = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const code = args.code.trim();

    const record = await ctx.db
      .query("otps")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!record) {
      return false;
    }

    if (record.code !== code) {
      return false;
    }

    if (record.expiresAt < Date.now()) {
      await ctx.db.delete(record._id);
      return false;
    }

    // Correct OTP, delete it so it can't be reused
    await ctx.db.delete(record._id);
    return true;
  },
});
