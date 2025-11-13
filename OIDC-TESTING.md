# OIDC Testing Guide

This guide shows you how to test the OIDC integration with your PocketID instance.

## Prerequisites

1. A PocketID instance (e.g., `https://your-instance.pocketid.app`)
2. An OIDC client configured in PocketID with:
   - Client type: **Public Client** (no client secret)
   - Redirect URI: `http://localhost:3000/callback/oidc`
   - Allowed grant types: **Authorization Code with PKCE**
   - Scopes: `openid`, `email`, `profile`

## Quick Test

1. **Test OIDC Discovery:**
   ```bash
   OIDC_ISSUER_URL=https://your-pocketid.example.com \
   OIDC_CLIENT_ID=your-client-id \
   bun test-oidc-local.ts
   ```
   This will verify your PocketID instance is accessible and generate a test authorization URL.

2. **Start ConvertX with OIDC:**
   ```bash
   # Create .env file with your credentials
   cp .env.example.oidc .env
   # Edit .env and add your actual values

   # Start the dev server
   bun run dev
   ```

3. **Test the Login Flow:**
   - Open http://localhost:3000/login in your browser
   - You should see a "Sign in with PocketID" button
   - Click it and complete authentication
   - You'll be redirected back and logged in!

## What Happens During Authentication

1. **User clicks "Sign in with PocketID"**
   - ConvertX generates PKCE code_verifier and code_challenge
   - Stores state, nonce, and code_verifier in secure httpOnly cookie
   - Redirects to PocketID authorization endpoint

2. **User authenticates on PocketID**
   - PocketID verifies user credentials
   - User grants permissions (openid, email, profile)
   - PocketID redirects back with authorization code

3. **ConvertX handles callback**
   - Validates state matches (CSRF protection)
   - Exchanges authorization code + code_verifier for tokens (PKCE)
   - Extracts email and sub from ID token
   - Creates or links user account in database
   - Sets authentication cookie and redirects to home page

## Expected Behavior

### First Login (New User)
- User authenticates with PocketID
- ConvertX creates new user account with OIDC credentials
- User is logged in and redirected to home page

### Subsequent Logins
- User authenticates with PocketID
- ConvertX finds existing user by `oidc_sub`
- User is logged in immediately

### Account Linking
If a user with the same email already exists:
- OIDC identity is linked to existing account
- User can now login with either email/password OR OIDC

## Troubleshooting

### "OIDC is not enabled"
- Make sure `OIDC_ISSUER_URL` is set in your .env file

### "Failed to generate OIDC authorization URL"
- Check that PocketID instance is accessible
- Verify client ID is correct
- Check OIDC discovery endpoint: `https://your-instance/.well-known/openid-configuration`

### "OIDC authentication failed"
- Check that redirect URI matches what's configured in PocketID
- Verify PKCE is enabled in PocketID client settings
- Check browser console for errors

### "Missing OIDC session data"
- This happens if cookies are blocked
- Enable cookies in your browser
- Make sure you're using HTTP (not HTTPS) with `HTTP_ALLOWED=true` in dev

## Security Features Implemented

✅ **PKCE (Proof Key for Code Exchange)** - Protects against authorization code interception
✅ **State Parameter** - CSRF protection
✅ **Nonce** - Replay attack protection
✅ **HttpOnly Cookies** - XSS protection
✅ **Secure Cookies** - Man-in-the-middle protection (in production)
✅ **Session Expiry** - 10-minute OIDC session timeout
✅ **Token Validation** - Full ID token verification

## Configuration Options

See `.env.example.oidc` for all available environment variables:

- `OIDC_ISSUER_URL` - Your PocketID instance
- `OIDC_CLIENT_ID` - OAuth2 client ID
- `OIDC_CLIENT_SECRET` - Optional (not needed for public clients)
- `OIDC_REDIRECT_URI` - Callback URL
- `OIDC_BUTTON_TEXT` - Customize button label
- `OIDC_ONLY` - Disable traditional login (optional)
- `HTTP_ALLOWED` - Allow HTTP in development

## Production Deployment

When deploying to production:

1. **Use HTTPS** - Set `HTTP_ALLOWED=false` (default)
2. **Update Redirect URI** - Use your production domain
3. **Secure JWT Secret** - Set a strong `JWT_SECRET`
4. **Configure PocketID** - Add production redirect URI to allowed list

Example production config:
```yaml
environment:
  - OIDC_ISSUER_URL=https://your-pocketid.example.com
  - OIDC_CLIENT_ID=your-client-id
  - OIDC_REDIRECT_URI=https://convertx.yourdomain.com/callback/oidc
  - HTTP_ALLOWED=false
  - JWT_SECRET=your-secure-secret-here
```
