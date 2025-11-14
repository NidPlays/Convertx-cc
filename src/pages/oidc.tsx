import { randomUUID } from "node:crypto";
import { Elysia } from "elysia";
import { userService } from "./user";
import db from "../db/db";
import { User } from "../db/types";
import { generateAuthorizationUrl, handleCallback } from "../helpers/oidc";
import { HTTP_ALLOWED, OIDC_ENABLED, WEBROOT } from "../helpers/env";

export const oidc = new Elysia()
  .use(userService)
  .get("/login/oidc", async ({ redirect, cookie, set }) => {
    if (!OIDC_ENABLED) {
      set.status = 404;
      return {
        message: "OIDC is not enabled.",
      };
    }

    // Check if already logged in
    if (cookie.auth?.value) {
      return redirect(`${WEBROOT}/`, 302);
    }

    const state = randomUUID();
    const nonce = randomUUID();

    // Generate authorization URL with PKCE
    const result = await generateAuthorizationUrl(state, nonce);

    if (!result) {
      set.status = 500;
      return {
        message: "Failed to generate OIDC authorization URL.",
      };
    }

    // Store state, nonce, and PKCE code_verifier in a secure httpOnly cookie
    const oidcSession = {
      state,
      nonce,
      codeVerifier: result.codeVerifier,
      timestamp: Date.now(),
    };

    // Store the session in a cookie using set.cookie
    cookie.oidc_session.set({
      value: JSON.stringify(oidcSession),
      httpOnly: true,
      secure: !HTTP_ALLOWED,
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return redirect(result.authUrl, 302);
  })
  .get(
    "/callback/oidc",
    async ({ request, redirect, set, jwt, cookie }) => {
      if (!OIDC_ENABLED) {
        set.status = 404;
        return {
          message: "OIDC is not enabled.",
        };
      }

      // Get the session data from cookie
      if (!cookie.oidc_session?.value) {
        set.status = 400;
        return {
          message: "Missing OIDC session data.",
        };
      }

      // Elysia automatically parses JSON cookies, so we can use the value directly
      const sessionData = cookie.oidc_session.value as { state: string; nonce: string; codeVerifier: string; timestamp: number };

      if (!sessionData.state || !sessionData.nonce || !sessionData.codeVerifier) {
        set.status = 400;
        return {
          message: "Invalid OIDC session data.",
        };
      }

      // Verify session hasn't expired (10 minutes)
      if (Date.now() - sessionData.timestamp > 600000) {
        cookie.oidc_session.remove();
        set.status = 400;
        return {
          message: "OIDC session expired.",
        };
      }

      const currentUrl = new URL(request.url);
      const result = await handleCallback(
        currentUrl,
        sessionData.state,
        sessionData.nonce,
        sessionData.codeVerifier,
      );

      // Clear the OIDC session cookie
      cookie.oidc_session.remove();

      if (!result) {
        set.status = 401;
        return {
          message: "OIDC authentication failed.",
        };
      }

      // Find or create user
      let user = db
        .query("SELECT * FROM users WHERE oidc_sub = ? AND oidc_provider = ?")
        .as(User)
        .get(result.sub, "oidc");

      if (!user) {
        // Check if a user with this email already exists
        const existingUser = db.query("SELECT * FROM users WHERE email = ?").as(User).get(result.email);

        if (existingUser) {
          // Link OIDC to existing account
          db.query("UPDATE users SET oidc_sub = ?, oidc_provider = ? WHERE id = ?").run(
            result.sub,
            "oidc",
            existingUser.id,
          );
          user = db.query("SELECT * FROM users WHERE id = ?").as(User).get(existingUser.id);
        } else {
          // Create new user
          db.query("INSERT INTO users (email, password, oidc_sub, oidc_provider) VALUES (?, NULL, ?, ?)").run(
            result.email,
            result.sub,
            "oidc",
          );
          user = db
            .query("SELECT * FROM users WHERE oidc_sub = ? AND oidc_provider = ?")
            .as(User)
            .get(result.sub, "oidc");
        }
      }

      if (!user) {
        set.status = 500;
        return {
          message: "Failed to create or find user.",
        };
      }

      // Create JWT token
      const accessToken = await jwt.sign({
        id: String(user.id),
      });

      if (!cookie.auth) {
        set.status = 500;
        return {
          message: "No auth cookie, perhaps your browser is blocking cookies.",
        };
      }

      // Set auth cookie
      cookie.auth.set({
        value: accessToken,
        httpOnly: true,
        secure: !HTTP_ALLOWED,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax", // Use "lax" for OIDC to allow cross-site navigation from OAuth provider
      });

      return redirect(`${WEBROOT}/`, 302);
    },
  );
