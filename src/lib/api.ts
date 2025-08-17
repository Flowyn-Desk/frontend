const API_BASE = "https://backend-897035279808.us-central1.run.app";
const TOKEN_KEY = "auth_token";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const payload = token ? JSON.parse(atob(token.split(".")[1])) as { exp?: number } : null;
    if (payload?.exp && payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
      throw new Error("Token expired");
    }
  } catch {
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    if (window && window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
    throw new Error("Unauthorized");
  }
  return res;
}

export { API_BASE };