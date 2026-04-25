// Tiny helpers for the bearer-token-in-localStorage scheme used across the app.
// Keep this file dependency-free so it works the same on every page.

export interface DecodedJwt {
  sub: number;
  name: string;
  email: string;
  iat?: number;
  exp?: number; // seconds since epoch
}

/** Decode a JWT payload without verifying. Returns null if malformed. */
export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    // base64url -> base64
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json) as DecodedJwt;
  } catch {
    return null;
  }
}

/** Is the JWT expired (or unparseable / missing exp claim)? */
export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  // 10s grace window so a token expiring during the request still goes through.
  return decoded.exp * 1000 < Date.now() - 10_000;
}

export interface CurrentUser {
  userId: number;
  name: string;
  email: string;
}

/** Read the current user from the stored JWT, or null if no/expired token. */
export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("accessToken");
  if (!token || isJwtExpired(token)) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return {
    userId: decoded.sub,
    name: decoded.name,
    email: decoded.email,
  };
}

/** Wipe credentials. Components should usually router.replace('/login') after. */
export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}
