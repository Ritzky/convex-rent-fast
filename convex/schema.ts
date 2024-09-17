import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    role: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    profile: v.optional(v.object({ // Add profile property conditionally
      fullName: v.optional(v.string()),
      numberOfProperties: v.optional(v.number()),
      currentAddress: v.optional(v.string()),
      numberOfPeople: v.optional(v.number()),
      currentIncome: v.optional(v.number()),
      areaToMove: v.optional(v.string()),
      moveDate: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      pets:  v.optional(v.number()),
      smoker: v.optional(v.string()),
      miles: v.optional(v.number()),
      summary: v.optional(v.string()),
      availability: v.optional(v.array(v.string())),
      keySkills: v.optional(v.array(v.string())),
      images: v.optional(v.array(v.string())),
    })),
  }).index('by_userId', ['userId']).index('by_email', ['email']),
  sessions: defineTable({
    userId: v.id("users"),
    expirationTime: v.number(),
  }).index("userId", ["userId"]),
  numbers: defineTable({
    userId: v.id("users"),
    value: v.number(),
  }).index("userId", ["userId"]),
});
