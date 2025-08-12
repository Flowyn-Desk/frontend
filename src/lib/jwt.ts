export function parseJwt<T = any>(token: string): T {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT");
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
    return JSON.parse(json) as T;
  }
  