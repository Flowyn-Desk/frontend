import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { parseJwt } from "../lib/jwt";

export type JwtPayload = {
  uuid: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
};

interface AuthContextValue {
  token: string | null;
  user: JwtPayload | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = "auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<JwtPayload | null>(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return null;
    try {
      return parseJwt<JwtPayload>(t);
    } catch {
      return null;
    }
  });

  const isExpired = useMemo(() => {
    if (!user?.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return user.exp <= now;
  }, [user]);

  const isAuthenticated = !!token && !!user && !isExpired;

  useEffect(() => {
    if (!user?.exp) return;
    const nowMs = Date.now();
    const expMs = user.exp * 1000;
    const delay = Math.max(0, expMs - nowMs);
    const id = window.setTimeout(() => {
      logout();
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.exp]);

  const login: AuthContextValue["login"] = async (email, password) => {
    const res = await fetch("http://localhost:3000/user/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const responseContent = await res.json();
      throw new Error(responseContent?.message || `Login failed (${res.status})`);
    }
    const json = (await res.json()) as { data?: string };
    const newToken = json.data;
    if (!newToken) throw new Error("No token in response");

    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    const payload = parseJwt<JwtPayload>(newToken);
    setUser(payload);
    navigate("/tickets", { replace: true });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    navigate("/login", { replace: true });
  };

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}