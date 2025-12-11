import { jwtDecode } from "jwt-decode";

export function getUserId(): number | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const payload: any = jwtDecode(token);
    return Number(payload.sub);
  } catch {
    return null;
  }
}
