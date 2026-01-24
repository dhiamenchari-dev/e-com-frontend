"use client";

import { usePathname } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  const normalized =
    /^[0-9a-fA-F]{3}$/.test(raw)
      ? raw
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

function srgbToLinear(c: number) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: { r: number; g: number; b: number }) {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function pickReadableForeground(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  const lum = relativeLuminance(rgb);
  return lum > 0.6 ? "#0c0a09" : "#ffffff";
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to2(Math.max(0, Math.min(255, Math.round(rgb.r))))}${to2(
    Math.max(0, Math.min(255, Math.round(rgb.g)))
  )}${to2(Math.max(0, Math.min(255, Math.round(rgb.b))))}`;
}

function mix(hexA: string, hexB: string, t: number) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA;
  const w = Math.max(0, Math.min(1, t));
  return rgbToHex({
    r: a.r + (b.r - a.r) * w,
    g: a.g + (b.g - a.g) * w,
    b: a.b + (b.b - a.b) * w,
  });
}

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  logoUrl: string | null;
  logoHeightPx: number;
  primaryColor: string;
  accentColor: string;
  heroHeadlineColor: string | null;
  heroHeadlineColor1: string | null;
  heroHeadlineColor2: string | null;
  shippingCents: number;
  discountPercent: number;
  fireEnabled: boolean;
  fireIntensity: number;
  heroHeadline: string;
  heroHeadline2: string;
  heroSubtitle: string;
  updatedAt: string;
};

type SettingsContextValue = {
  settings: SiteSettings | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ settings: SiteSettings }>("/api/settings");
      setSettings(data.settings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      refresh().catch(() => {});
    }, 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>(".bg-flame-video");
    if (!video) return;
    const apply = () => {
      video.defaultPlaybackRate = 0.6;
      video.playbackRate = 0.6;
    };
    apply();
    video.addEventListener("loadedmetadata", apply);
    return () => video.removeEventListener("loadedmetadata", apply);
  }, []);

  useEffect(() => {
    if (!settings) return;
    document.documentElement.style.setProperty("--brand-primary", settings.primaryColor);
    document.documentElement.style.setProperty("--brand-accent", settings.accentColor);
    document.documentElement.style.setProperty("--brand-accent-hover", mix(settings.accentColor, "#ffffff", 0.18));
    const headline1 = settings.heroHeadlineColor1 ?? settings.heroHeadlineColor ?? settings.accentColor;
    const headline2 = settings.heroHeadlineColor2 ?? "currentColor";
    document.documentElement.style.setProperty("--hero-headline-1", headline1);
    document.documentElement.style.setProperty("--hero-headline-2", headline2);
    document.documentElement.style.setProperty("--hero-headline-accent", headline1);
    document.documentElement.style.setProperty(
      "--brand-primary-foreground",
      pickReadableForeground(settings.primaryColor)
    );
    document.documentElement.style.setProperty(
      "--brand-accent-foreground",
      pickReadableForeground(settings.accentColor)
    );
    const intensity = Math.max(0, Math.min(100, settings.fireIntensity ?? 0));
    const opacity = !settings.fireEnabled
      ? 0
      : intensity === 0
        ? 0
        : 0.08 + (intensity / 100) * 0.07;
    document.documentElement.style.setProperty("--fire-overlay-opacity", String(opacity));
    document.documentElement.style.setProperty("--flame-video-opacity", String(opacity));
    document.documentElement.style.setProperty("--smoke-opacity", String(Math.max(0, Math.min(0.12, opacity * 0.7))));
  }, [settings]);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    root.style.setProperty("--fire-dynamic-boost", "0");
    root.style.setProperty("--fire-pulse", "0");
    root.style.setProperty("--fire-flicker-speed", "1");
    root.style.setProperty("--fire-drift-speed", "1");
    if (!settings.fireEnabled) return;

    let hoverBoost = 0;
    let scrollBoost = 0;
    let routeBoost = 0;
    let pulseValue = 0;
    let pulseTimer: number | null = null;

    const setBoostVar = () => {
      const sum = Math.max(0, Math.min(0.6, hoverBoost + scrollBoost + routeBoost));
      root.style.setProperty("--fire-dynamic-boost", String(sum));
    };

    const applyRouteProfile = () => {
      const p = pathname || "";
      if (p.startsWith("/checkout") || p.startsWith("/order")) {
        routeBoost = 0.08;
        root.style.setProperty("--fire-flicker-speed", "2.2");
        root.style.setProperty("--fire-drift-speed", "0.9");
        setBoostVar();
        return;
      }
      if (p.startsWith("/admin")) {
        routeBoost = 0;
        root.style.setProperty("--fire-flicker-speed", "3");
        root.style.setProperty("--fire-drift-speed", "0.7");
        setBoostVar();
        return;
      }
      routeBoost = 0;
      root.style.setProperty("--fire-flicker-speed", "1");
      root.style.setProperty("--fire-drift-speed", "1");
      setBoostVar();
    };

    applyRouteProfile();

    const onHover = (ev: Event) => {
      const e = ev as CustomEvent<{ active?: boolean; amount?: number }>;
      const active = !!e.detail?.active;
      const amount = typeof e.detail?.amount === "number" ? e.detail.amount : 0.12;
      hoverBoost = active ? Math.max(0, Math.min(0.25, amount)) : 0;
      setBoostVar();
    };

    const onPulse = (ev: Event) => {
      const e = ev as CustomEvent<{ amount?: number; durationMs?: number }>;
      const amount = typeof e.detail?.amount === "number" ? e.detail.amount : 0.22;
      const durationMs = typeof e.detail?.durationMs === "number" ? e.detail.durationMs : 1000;
      pulseValue = Math.max(pulseValue, Math.max(0, Math.min(0.6, amount)));
      root.style.setProperty("--fire-pulse", String(pulseValue));
      if (pulseTimer) window.clearTimeout(pulseTimer);
      pulseTimer = window.setTimeout(() => {
        pulseValue = 0;
        root.style.setProperty("--fire-pulse", "0");
      }, Math.max(150, durationMs));
    };

    let raf = 0;
    let scrollTarget = 0;
    let scrollCurrent = 0;

    const computeScrollTarget = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.max(0, Math.min(1, window.scrollY / max));
      scrollTarget = p;
    };

    const tick = () => {
      scrollCurrent += (scrollTarget - scrollCurrent) * 0.08;
      scrollBoost = Math.max(0, Math.min(0.14, scrollCurrent * 0.14));
      setBoostVar();
      raf = window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      computeScrollTarget();
    };

    computeScrollTarget();
    raf = window.requestAnimationFrame(tick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("fire:hover", onHover as EventListener);
    window.addEventListener("fire:pulse", onPulse as EventListener);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("fire:hover", onHover as EventListener);
      window.removeEventListener("fire:pulse", onPulse as EventListener);
      window.cancelAnimationFrame(raf);
      if (pulseTimer) window.clearTimeout(pulseTimer);
    };
  }, [pathname, settings]);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, isLoading, refresh }),
    [isLoading, refresh, settings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("SettingsProvider missing");
  return ctx;
}
