import { jwtDecode } from "jwt-decode";

export type UserRole = "patient" | "psychiatrist" | "psychologist";

interface TokenPayload {
  sub: number;
  name?: string;
  email?: string;
  role?: UserRole;
  exp?: number;
}

/**
 * Read the role embedded in the JWT. Defaults to "patient" so older tokens
 * issued before this feature still work without forcing a re-login.
 */
export function getUserRole(): UserRole {
  if (typeof window === "undefined") return "patient";
  const token = localStorage.getItem("accessToken");
  if (!token) return "patient";
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.role ?? "patient";
  } catch {
    return "patient";
  }
}

export function isProfessionalRole(role: UserRole | undefined): boolean {
  return role === "psychiatrist" || role === "psychologist";
}
