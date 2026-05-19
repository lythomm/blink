import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  events: defineTable({
    name: v.string(),
    createdAt: v.number(),
    endsAt: v.number(),
    maxPhotosPerParticipant: v.number(),
    creatorId: v.string(),
  })
    .index("by_creator", ["creatorId"]),
  photos: defineTable({
    eventId: v.string(),
    guestId: v.string(),
    cloudinaryId: v.string(),
    createdAt: v.number(),
  }).index("by_event", ["eventId"])
    .index("by_event_and_guest", ["eventId", "guestId"]),
  participants: defineTable({
    eventId: v.string(),
    guestId: v.string(),
    name: v.optional(v.string()),
    joinedAt: v.number(),
  }).index("by_event", ["eventId"])
    .index("by_event_and_guest", ["eventId", "guestId"]),
  otps: defineTable({
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
  }).index("by_email", ["email"]),
});
