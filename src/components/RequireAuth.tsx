"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
import { Spinner } from "./Spinner";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (user) return;
    let next = window.location.pathname;
    try {
      const url = new URL(window.location.href);
      next = url.searchParams.get("next") ?? next;
    } catch {}
    router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
  }, [isReady, router, user]);

  if (!isReady) return <Spinner />;
  if (!user) return <Spinner />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(`/auth/login?next=${encodeURIComponent("/admin")}`);
      return;
    }
    if (user.role !== "ADMIN") router.replace("/");
  }, [isReady, router, user]);

  if (!isReady) return <Spinner />;
  if (!user) return <Spinner />;
  if (user.role !== "ADMIN") return <Spinner />;
  return <>{children}</>;
}
