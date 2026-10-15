import * as client from "openid-client";
import {
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_ENABLED,
  OIDC_ISSUER_URL,
  OIDC_REDIRECT_URI,
} from "./env";

let oidcConfig: client.Configuration | null = null;

async function getOIDCConfig(): Promise<client.Configuration | null> {
  if (!OIDC_ENABLED) {
    return null;
  }

  if (oidcConfig) {
    return oidcConfig;
  }

  try {
    const issuerUrl = new URL(OIDC_ISSUER_URL);
    // Support both public clients (no secret) and confidential clients (with secret)
    const clientAuth = OIDC_CLIENT_SECRET ? OIDC_CLIENT_SECRET : undefined;
    oidcConfig = await client.discovery(issuerUrl, OIDC_CLIENT_ID, clientAuth);
    return oidcConfig;
  } catch (error) {
    console.error("Failed to discover OIDC configuration:", error);
    return null;
  }
}

export async function generateAuthorizationUrl(
  state: string,
  nonce: string,
): Promise<{ authUrl: string; codeVerifier: string } | null> {
  const config = await getOIDCConfig();
  if (!config) {
    return null;
  }

  // Generate PKCE code verifier for public client security
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
  return {
    authUrl: authUrl.href,
    codeVerifier,
  };
}

export async function handleCallback(
  currentUrl: URL,
  expectedState: string,
  expectedNonce: string,
  pkceCodeVerifier: string,
): Promise<{ email: string; sub: string } | null> {
  const config = await getOIDCConfig();
  if (!config) {
    return null;
  }

  try {
    // openid-client derives the token request's redirect_uri from this URL. Behind a
    // reverse proxy the incoming request URL has the internal scheme/host (e.g.
    // http://localhost:3000), which won't match the registered redirect URI and the
    // provider rejects the code exchange. Rebuild it from OIDC_REDIRECT_URI instead.
    const callbackUrl = new URL(OIDC_REDIRECT_URI);
    callbackUrl.search = currentUrl.search;

    const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
      expectedState,
      expectedNonce,
      pkceCodeVerifier,
    });

    const claims = tokens.claims();
    if (!claims || !claims.email || !claims.sub) {
      console.error("OIDC claims missing required fields:", claims);
      return null;
    }

    return {
      email: claims.email as string,
      sub: claims.sub,
    };
  } catch (error) {
    console.error("OIDC callback error:", error);
    return null;
  }
}
