import { jwtDecode } from "jwt-decode";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
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
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
