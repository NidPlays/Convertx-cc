export const ACCOUNT_REGISTRATION =
  process.env.ACCOUNT_REGISTRATION?.toLowerCase() === "true" || false;

export const HTTP_ALLOWED = process.env.HTTP_ALLOWED?.toLowerCase() === "true" || false;

export const ALLOW_UNAUTHENTICATED =
  process.env.ALLOW_UNAUTHENTICATED?.toLowerCase() === "true" || false;

export const AUTO_DELETE_EVERY_N_HOURS = process.env.AUTO_DELETE_EVERY_N_HOURS
  ? Number(process.env.AUTO_DELETE_EVERY_N_HOURS)
  : 24;

export const HIDE_HISTORY = process.env.HIDE_HISTORY?.toLowerCase() === "true" || false;

export const WEBROOT = process.env.WEBROOT ?? "";

export const LANGUAGE = process.env.LANGUAGE?.toLowerCase() || "en";

export const MAX_CONVERT_PROCESS =
  process.env.MAX_CONVERT_PROCESS && Number(process.env.MAX_CONVERT_PROCESS) > 0
    ? Number(process.env.MAX_CONVERT_PROCESS)
    : 0;

export const UNAUTHENTICATED_USER_SHARING =
  process.env.UNAUTHENTICATED_USER_SHARING?.toLowerCase() === "true" || false;

// OIDC Configuration
export const OIDC_ENABLED = process.env.OIDC_ISSUER_URL ? true : false;
export const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL || "";
export const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || "";
export const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || ""; // Optional for public clients
export const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI || "";
export const OIDC_ONLY = process.env.OIDC_ONLY?.toLowerCase() === "true" || false;
export const OIDC_BUTTON_TEXT = process.env.OIDC_BUTTON_TEXT || "Sign in with OIDC";
