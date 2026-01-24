"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, getErrorStatus } from "./api";
import { getFromStorage, removeFromStorage, setToStorage } from "./clientStorage";
import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isReady: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  authedFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
};

const ACCESS_TOKEN_KEY = "ecom_access_token";

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeHeaders(initHeaders: HeadersInit | undefined): Record<string, string> | undefined {
  if (!initHeaders) return undefined;
  if (initHeaders instanceof Headers) {
    const out: Record<string, string> = {};
    initHeaders.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(initHeaders)) {
    return Object.fromEntries(initHeaders);
  }
  return initHeaders;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getFromStorage(ACCESS_TOKEN_KEY));
  const [isReady, setIsReady] = useState(false);

  const setToken = useCallback((token: string | null) => {
    setAccessToken(token);
    if (token) setToStorage(ACCESS_TOKEN_KEY, token);
    else removeFromStorage(ACCESS_TOKEN_KEY);
  }, []);

  const fetchMe = useCallback(
    async (token: string) => {
      const data = await apiFetch<{ user: User }>("/api/auth/me", {
        accessToken: token,
      });
      setUser(data.user);
    },
    []
  );

  const refresh = useCallback(async () => {
    const data = await apiFetch<{ accessToken: string }>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setToken(data.accessToken);
    await fetchMe(data.accessToken);
  }, [fetchMe, setToken]);

  const refreshMe = useCallback(async () => {
    if (!accessToken) throw new Error("Unauthorized");
    try {
      await fetchMe(accessToken);
    } catch {
      await refresh();
    }
  }, [accessToken, fetchMe, refresh]);

  useEffect(() => {
    const stored = getFromStorage(ACCESS_TOKEN_KEY);
    const t = window.setTimeout(() => {
      (async () => {
        if (!stored) return;
        try {
          await fetchMe(stored);
        } catch {
          try {
            await refresh();
          } catch {
            setToken(null);
            setUser(null);
          }
        }
      })()
        .catch(() => {})
        .finally(() => setIsReady(true));
    }, 0);

    return () => window.clearTimeout(t);
  }, [fetchMe, refresh, setToken]);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const data = await apiFetch<{ user: User; accessToken: string }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify(input) }
      );
      setToken(data.accessToken);
      setUser(data.user);
    },
    [setToken]
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const data = await apiFetch<{ user: User; accessToken: string }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify(input) }
      );
      setToken(data.accessToken);
      setUser(data.user);
    },
    [setToken]
  );

  const logout = useCallback(async () => {
    await apiFetch<void>("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    setToken(null);
    setUser(null);
  }, [setToken]);

  const authedFetch = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      const attempt = async (token: string | null) => {
        const headers = normalizeHeaders(init?.headers);
        return apiFetch<T>(path, {
          ...(init ?? {}),
          body: init?.body,
          accessToken: token,
          headers,
        });
      };

      try {
        return await attempt(accessToken);
      } catch (e: unknown) {
        if (getErrorStatus(e) !== 401) throw e;
        await refresh();
        const nextToken = getFromStorage(ACCESS_TOKEN_KEY);
        return attempt(nextToken);
      }
    },
    [accessToken, refresh]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, accessToken, isReady, login, register, logout, refreshMe, authedFetch }),
    [accessToken, authedFetch, isReady, login, logout, refreshMe, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
