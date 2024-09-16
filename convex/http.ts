import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { SESSION_DURATION_MS } from "./auth";
import { convertErrorsToResponse, corsRoutes, getCookies } from "./helpers";
import * as cookie from "cookie";

const http = httpRouter();

http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        issuer: process.env.CONVEX_SITE_URL,
        jwks_uri: process.env.CONVEX_SITE_URL + "/.well-known/jwks.json",
        authorization_endpoint:
          process.env.CONVEX_SITE_URL + "/oauth/authorize",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }),
});

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async (ctx) => {
    return new Response(
      JSON.stringify({
        keys: [
          { use: "sig", ...(await ctx.runAction(internal.node.publicJWK)) },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }),
});

const SESSION_COOKIE_NAME = "__session";

const httpWithCors = corsRoutes(http, siteUrl);

httpWithCors.route({
  path: "/auth/token",
  method: "GET",
  credentials: true,
  handler: httpAction(
    convertErrorsToResponse(401, async (ctx, req) => { // Changed error status code to 401 for unauthorized access
      try {
        const sessionId = getCookies(req)[SESSION_COOKIE_NAME];
        if (!sessionId) {
          return new Response(null, { status: 401 });
        }
        const token = await ctx.runAction(internal.node.generateToken, { sessionId });
        return new Response(token, {
          status: 200,
          headers: {
            "Content-Type": "text/plain", // Use text/plain for plain text response
            ...sessionCookieHeader(sessionId, "refresh"), // Ensure this header is correct
          },
        });
      } catch (error) {
        console.error("Error in /auth/token:", error); // Log error for debugging
        return new Response(null, { status: 500 }); // Return a 500 Internal Server Error if something goes wrong
      }
    })
  ),
});


httpWithCors.route({
  path: "/auth/signUp",
  method: "POST",
  credentials: true,
  handler: httpAction(
    convertErrorsToResponse(400, async (ctx, req) => {
      try {
        const data = await req.json();
        const email = data.email as string;
        const password = data.password as string;
        const role = data.role as string;
        const profile = data.profile;

        // Validate role
        if (!role || !['Landlord', 'Tenant', 'Maintenance', 'Cleaner'].includes(role)) {
          throw new Error("Invalid role");
        }

        // Validate profile based on role
        if (role === 'Landlord') {
          if (!profile || typeof profile.numberOfProperties !== 'number') {
            throw new Error("Invalid profile for Landlord");
          }
        } else if (role === 'Tenant') {
          if (!profile || typeof profile.currentAddress !== 'string') {
            throw new Error("Invalid profile for Tenant");
          }
        } else if (role === 'Maintenance' || role === 'Cleaner') {
          if (!profile || !Array.isArray(profile.availability)) {
            throw new Error("Invalid profile for Maintenance or Cleaner");
          }
        }

        // Proceed with signup
        const sessionId = await ctx.runMutation(internal.auth.signUp, {
          email,
          password,
          role,
          profile,
        });

        return new Response(null, {
          status: 200,
          headers: sessionCookieHeader(sessionId, "refresh"),
        });
      } catch (error) {
        // Type assertion
        const errorMessage = (error as Error).message;
        console.error("Error in /auth/signUp:", errorMessage);
        return new Response(errorMessage, { status: 400 });
      }
    })
  ),
});




httpWithCors.route({
  path: "/auth/signIn",
  method: "POST",
  credentials: true,
  handler: httpAction(
    convertErrorsToResponse(401, async (ctx, req) => {
      try {
        const data = await req.json(); // Use req.json() for JSON body
        const email = data.email as string;
        const password = data.password as string;

        if (!email || !password) {
          throw new Error("Email or password missing");
        }

        const sessionId = await ctx.runMutation(internal.auth.signIn, {
          email,
          password,
        });

        return new Response(null, {
          status: 200,
          headers: sessionCookieHeader(sessionId, "refresh"),
        });
      } catch (error) {
        console.error("Error in /auth/signIn:", error);
        throw error;
      }
    })
  ),
});

httpWithCors.route({
  path: "/auth/signOut",
  method: "POST",
  credentials: true,
  handler: httpAction(
    convertErrorsToResponse(401, async (ctx, req) => {
      const sessionId = getCookies(req)[SESSION_COOKIE_NAME];
      await ctx.runMutation(internal.auth.signOut, { sessionId });
      return new Response(null, {
        status: 200,
        headers: sessionCookieHeader(sessionId!, "expired"),
      });
    })
  ),
});

function sessionCookieHeader(value: string, expire: "refresh" | "expired") {
  const expires = new Date(
    expire === "refresh" ? Date.now() + SESSION_DURATION_MS : 0
  );
  return {
    "Set-Cookie": cookie.serialize(SESSION_COOKIE_NAME, value, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      partitioned: true,
      expires,
    }),
  };
}

function siteUrl() {
  return process.env.SITE_URL ?? "http://localhost:3000";
}

export default http;