#!/usr/bin/env bun
// Test OIDC configuration locally
// Run with: bun test-oidc-local.ts
// Or with env vars: OIDC_ISSUER_URL=... OIDC_CLIENT_ID=... bun test-oidc-local.ts

import { randomUUID } from "node:crypto";
import * as client from "openid-client";

// Read from environment variables or use placeholders
const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL || "https://your-pocketid.example.com";
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || "your-client-id-here";
const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI || "http://localhost:3000/callback/oidc";

async function testOIDC() {
  console.log("🧪 Testing OIDC Configuration...\n");
  console.log("Configuration:");
  console.log(`  Issuer: ${OIDC_ISSUER_URL}`);
  console.log(`  Client ID: ${OIDC_CLIENT_ID}`);
  console.log(`  Redirect URI: ${OIDC_REDIRECT_URI}\n`);

  if (OIDC_ISSUER_URL.includes("example.com") || OIDC_CLIENT_ID.includes("your-client")) {
    console.error("❌ Error: Please set your actual OIDC credentials!");
    console.log("\nOptions:");
    console.log("  1. Set environment variables:");
    console.log("     OIDC_ISSUER_URL=https://your-instance.pocketid.app \\");
    console.log("     OIDC_CLIENT_ID=your-client-id \\");
    console.log("     bun test-oidc-local.ts");
    console.log("\n  2. Or create a .env file with your credentials");
    process.exit(1);
  }

  try {
    // Test 1: OIDC Discovery
    console.log("1️⃣ Testing OIDC Discovery...");
    const issuerUrl = new URL(OIDC_ISSUER_URL);
    const config = await client.discovery(issuerUrl, OIDC_CLIENT_ID, undefined);
    console.log("✅ OIDC Discovery successful!");
    console.log(`   Issuer: ${config.serverMetadata().issuer}`);
    console.log(`   Auth Endpoint: ${config.serverMetadata().authorization_endpoint}`);
    console.log(`   Token Endpoint: ${config.serverMetadata().token_endpoint}`);
    console.log(
      `   PKCE Methods: ${config.serverMetadata().code_challenge_methods_supported?.join(", ")}\n`,
    );

    // Test 2: Generate Authorization URL with PKCE
    console.log("2️⃣ Generating Authorization URL with PKCE...");
    const state = randomUUID();
    const nonce = randomUUID();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

    const parameters: Record<string, string> = {
      redirect_uri: OIDC_REDIRECT_URI,
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    };

    const authUrl = client.buildAuthorizationUrl(config, parameters);
    console.log("✅ Authorization URL generated successfully!\n");
    console.log("━".repeat(80));
    console.log("📋 AUTHORIZATION URL (copy and open in browser):");
    console.log("━".repeat(80));
    console.log(authUrl.href);
    console.log("━".repeat(80));

    console.log("\n🔐 PKCE Details (stored in session cookie):");
    console.log(`   Code Verifier: ${codeVerifier.substring(0, 30)}...`);
    console.log(`   Code Challenge: ${codeChallenge.substring(0, 30)}...`);
    console.log(`   Challenge Method: S256`);
    console.log(`   State: ${state}`);
    console.log(`   Nonce: ${nonce}\n`);

    console.log("✅ All OIDC configuration tests passed!\n");
    console.log("📝 Next steps:");
    console.log("   1. Start the ConvertX dev server: bun run dev");
    console.log("   2. Visit http://localhost:3000/login");
    console.log("   3. Click 'Sign in with PocketID' button");
    console.log("   4. Complete authentication on PocketID");
    console.log("   5. You'll be redirected back and logged in!");
  } catch (error) {
    console.error("❌ OIDC Configuration Error:");
    console.error(error);
    process.exit(1);
  }
}

testOIDC();
