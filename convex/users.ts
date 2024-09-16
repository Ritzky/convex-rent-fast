import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const setUserRole = mutation({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }
    const userId = identity.subject;

    // Check if user already has a role
    const existingUser = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('userId'), userId))
      .first();

    if (existingUser) {
      // Update existing user's role
      await ctx.db.patch(existingUser._id, { role: args.role });
    } else {
      throw new Error('User not found');
    }
  },
});

export const getUserRole = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = identity.subject;

    const user = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('userId'), userId))
      .first();

    return user ? user.role : null;
  },
});

export const getUserProfile = query({
    handler: async (ctx) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null;
      }
      const userId = identity.subject;
  
      const user = await ctx.db
        .query('users')
        .filter(q => q.eq(q.field('userId'), userId))
        .first();
  
      return user ? user.profile : null;
    },
  });
  
