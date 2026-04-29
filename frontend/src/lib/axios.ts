import axios, { AxiosInstance } from "axios";

// The backend now lives behind `/api/v1/*` (URI versioning). All callers use
// bare paths like `/auth/login` and `/users/:id`, which get prefixed here.
const API_HOST =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const api: AxiosInstance = axios.create({
  baseURL: `${API_HOST}/api/v1`,
});

// Attach the bearer token only on the client.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// Global Axios response handler. We do two things here:
//   1. Log a single line for any failed call so the console isn't a graveyard.
//   2. Treat 401 as "your session ended" and bounce to /login. We avoid
//      doing this on the /auth/login route itself so that a wrong-password
//      attempt surfaces normally to the page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url: string = err.config?.url ?? "";
    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");

    if (typeof window !== "undefined" && status === 401 && !isAuthCall) {
      // Session is gone - wipe and boot to login.
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      } catch {
        /* ignore */
      }
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login?expired=1");
      }
    }

    // Log a single, useful line. `err.response.data` can be `{}` when the
    // server returns no body, so fall through to status text + message.
    const method = (err.config?.method ?? "GET").toUpperCase();
    const body = err.response?.data;
    const hasBody = body && Object.keys(body as object).length > 0;
    console.error(
      `API Error: ${method} ${url} -> ${status ?? "no status"}`,
      hasBody ? body : err.response?.statusText || err.message,
    );
    return Promise.reject(err);
  },
);

export default api;
