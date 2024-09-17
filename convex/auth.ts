import { ConvexError, v } from "convex/values";
import { MutationCtx, QueryCtx, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { Scrypt } from "lucia";

export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export const signUp = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    role: v.string(),
    profile: v.object({ // Combined profiles into a single object
      role: v.string(), // Add role to distinguish profile types
      details: v.optional(v.union( // Use union for details based on role
        v.object({ // Landlord profile
          fullName: v.string(),
          numberOfProperties: v.number(),
        }),
        v.object({ // Tenant profile
          currentAddress: v.string(),
          numberOfPeople: v.number(),
          currentIncome: v.number(),
          fullName: v.string(),
          areaToMove: v.string(),
          moveDate: v.string(),
          jobTitle: v.string(),
          smoker: v.string(),
          pets: v.number(),
          miles: v.number(),
          summary: v.string(),
        }),
        v.object({ // Maintenance or Cleaner profile
          fullName: v.string(),
          availability: v.array(v.string()),
          keySkills: v.array(v.string()),
          areaToMove: v.string(),
          miles: v.number(),
          images: v.array(v.string()),
          summary: v.string(),
        }),
      )),
    }),
  },
  handler: async (ctx, { email, password, role, profile }) => {
    // TODO: Validate email and password length / character set
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existingUser !== null) {
      throw new ConvexError("User already exists");
    }
    const userId = await ctx.db.insert("users", {
      email,
      passwordHash: await hashPassword(password),
      userId: email, // Assuming email is used as userId, adjust as necessary
      role: role,   // Set the role from the signup
      profile: role === 'Landlord' ? { // Check if the user is a landlord
        fullName: (profile.details as { fullName: string}).fullName || '', // Full name or company name
        numberOfProperties: (profile.details as { numberOfProperties: number }).numberOfProperties || 0, // Number of properties to rent out
      } : (role === 'Tenant') ? { // For tenants
        currentAddress:(profile.details as { currentAddress: string }).currentAddress || '',
        numberOfPeople: (profile.details as { numberOfPeople: number }).numberOfPeople || 0,
        currentIncome: (profile.details as { currentIncome: number }).currentIncome || 0,
        jobTitle: (profile.details as {jobTitle: string}).jobTitle || '',
        pets: (profile.details as {pets: number}).pets || 0,
        smoker: (profile.details as {smoker: string}).smoker || 'no',
        fullName: (profile.details as { fullName: string }).fullName || '', // Array for multiple names
        areaToMove: (profile.details as { areaToMove: string }).areaToMove|| '',
        moveDate: (profile.details as { moveDate: string }).moveDate|| '',
        miles: (profile.details as { miles: number }).miles || 0,
        summary: (profile.details as { summary: string }).summary || '', // Ensure correct type assertion
      } : (role === 'Maintenance' || role === 'Cleaner') ? { // For maintenance or cleaners
        fullName: (profile.details as { fullName: string }).fullName || '', // Array for multiple names
        availability: (profile.details as { availability: string[] }).availability || [], // Days of the week
        keySkills: (profile.details as { keySkills: string[] }).keySkills || [], // Key skills
        images: (profile.details as { images: string[] }).images || [], // Ensure images is an array
        summary: (profile.details as { summary: string }).summary || '', // Summary
      } : undefined, // Handle case where role is neither landlord, tenant, maintenance, nor cleaner
    });
    return await createSession(ctx, userId);
  },
});

export const signIn = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (user === null) {
      throw new ConvexError("Email not found");
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw new ConvexError("Incorrect password");
    }
    return await createSession(ctx, user._id);
  },
});

export const signOut = internalMutation({
  args: {
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId }) => {
    const session = await getSession(ctx, sessionId);
    if (session !== null) {
      await ctx.db.delete(session._id);
    }
  },
});

export const verifyAndRefreshSession = internalMutation({
  args: {
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId }) => {
    const session = await getSession(ctx, sessionId);
    if (session === null || session.expirationTime < Date.now()) {
      throw new ConvexError("Invalid session cookie");
    }
    await ctx.db.patch(session._id, {
      expirationTime: Date.now() + SESSION_DURATION_MS,
    });
    return session.userId;
  },
});

async function createSession(ctx: MutationCtx, userId: Id<"users">) {
  return await ctx.db.insert("sessions", {
    expirationTime: Date.now() + SESSION_DURATION_MS,
    userId,
  });
}

async function getSession(ctx: QueryCtx, sessionId: string | undefined) {
  if (sessionId === undefined) {
    return null;
  }
  const validId = ctx.db.normalizeId("sessions", sessionId);
  if (validId === null) {
    return null;
  }
  return await ctx.db.get(validId);
}

async function hashPassword(password: string) {
  return await new Scrypt().hash(password);
}

async function verifyPassword(password: string, hash: string) {
  return await new Scrypt().verify(hash, password);
}
