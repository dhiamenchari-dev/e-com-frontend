"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../../../components/AdminShell";
import { RequireAdmin } from "../../../components/RequireAuth";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { useAuth } from "../../../lib/auth";
import { getErrorMessage } from "../../../lib/api";
import { useSettings } from "../../../lib/settings";
import { formatMoney } from "../../../lib/money";

type AdminSettings = {
  id: string;
  siteName: string;
  siteDescription: string;
  logoUrl: string | null;
  logoPublicId: string | null;
  logoHeightPx: number;
  primaryColor: string;
  accentColor: string;
  shippingCents: number;
  discountPercent: number;
  fireEnabled: boolean;
  fireIntensity: number;
  heroHeadline: string;
  heroHeadline2: string;
  heroSubtitle: string;
  heroHeadlineColor: string | null;
  heroHeadlineColor1: string | null;
  heroHeadlineColor2: string | null;
  updatedAt: string;
};

export default function AdminSettingsPage() {
  return (
    <RequireAdmin>
      <AdminSettingsInner />
    </RequireAdmin>
  );
}

function AdminSettingsInner() {
  const { authedFetch, refreshMe, user } = useAuth();
  const { refresh: refreshPublicSettings } = useSettings();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [draft, setDraft] = useState<{
    siteName: string;
    siteDescription: string;
    primaryColor: string;
    accentColor: string;
    logoHeightPx: string;
    shippingMad: string;
    discountPercent: string;
    fireEnabled: boolean;
    fireIntensity: number;
    heroHeadline: string;
    heroHeadline2: string;
    heroSubtitle: string;
    heroHeadlineColor1: string;
    heroHeadlineColor2: string;
    heroHeadlineColor1UseDefault: boolean;
    heroHeadlineColor2UseDefault: boolean;
  } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [adminEmailDraft, setAdminEmailDraft] = useState("");
  const [adminEmailPassword, setAdminEmailPassword] = useState("");
  const [adminPwCurrent, setAdminPwCurrent] = useState("");
  const [adminPwNext, setAdminPwNext] = useState("");
  const [adminPwConfirm, setAdminPwConfirm] = useState("");
  const [adminEmailSaving, setAdminEmailSaving] = useState(false);
  const [adminPwSaving, setAdminPwSaving] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      authedFetch<{ settings: AdminSettings }>("/api/admin/settings")
        .then((d) => {
          const isDark = document.documentElement.classList.contains("dark");
          const fallbackHeadline2 = isDark ? "#fafafa" : "#111827";
          const savedHeadline1 = d.settings.heroHeadlineColor1 ?? d.settings.heroHeadlineColor;
          const savedHeadline2 = d.settings.heroHeadlineColor2;
          setSettings(d.settings);
          setDraft({
            siteName: d.settings.siteName,
            siteDescription: d.settings.siteDescription,
            primaryColor: d.settings.primaryColor,
            accentColor: d.settings.accentColor,
            logoHeightPx: String(d.settings.logoHeightPx),
            shippingMad: (d.settings.shippingCents / 100).toFixed(2),
            discountPercent: String(d.settings.discountPercent),
            fireEnabled: d.settings.fireEnabled,
            fireIntensity: d.settings.fireIntensity,
            heroHeadline: d.settings.heroHeadline,
            heroHeadline2: d.settings.heroHeadline2,
            heroSubtitle: d.settings.heroSubtitle,
            heroHeadlineColor1: savedHeadline1 ?? d.settings.accentColor,
            heroHeadlineColor2: savedHeadline2 ?? fallbackHeadline2,
            heroHeadlineColor1UseDefault: savedHeadline1 == null,
            heroHeadlineColor2UseDefault: savedHeadline2 == null,
          });
        })
        .catch((e: unknown) => setError(getErrorMessage(e, "Failed to load settings")));
    }, 0);
    return () => window.clearTimeout(t);
  }, [authedFetch]);

  useEffect(() => {
    setAdminEmailDraft(user?.email ?? "");
  }, [user?.email]);

  const shippingCentsDraft = useMemo(() => {
    if (!draft) return null;
    const normalized = draft.shippingMad.replace(",", ".").trim();
    if (!normalized) return null;
    const n = Number(normalized);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.round(n * 100));
  }, [draft]);

  const discountPercentDraft = useMemo(() => {
    if (!draft) return null;
    const trimmed = draft.discountPercent.trim();
    if (!trimmed) return null;
    const n = Math.trunc(Number(trimmed));
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(90, n));
  }, [draft]);

  const logoHeightPxDraft = useMemo(() => {
    if (!draft) return null;
    const trimmed = draft.logoHeightPx.trim();
    if (!trimmed) return null;
    const n = Math.trunc(Number(trimmed));
    if (!Number.isFinite(n)) return null;
    return Math.max(1, Math.min(512, n));
  }, [draft]);

  const generalDirty = useMemo(() => {
    if (!settings || !draft) return false;
    if (logoHeightPxDraft === null) return false;
    return (
      settings.siteName !== draft.siteName ||
      settings.siteDescription !== draft.siteDescription ||
      settings.logoHeightPx !== logoHeightPxDraft ||
      settings.primaryColor !== draft.primaryColor ||
      settings.accentColor !== draft.accentColor
    );
  }, [draft, logoHeightPxDraft, settings]);

  const basicDirty = useMemo(() => {
    if (!settings || !draft) return false;
    return (
      settings.siteName !== draft.siteName ||
      settings.siteDescription !== draft.siteDescription
    );
  }, [draft, settings]);

  const checkoutDirty = useMemo(() => {
    if (!settings || !draft) return false;
    if (shippingCentsDraft === null || discountPercentDraft === null) return false;
    return (
      settings.shippingCents !== shippingCentsDraft ||
      settings.discountPercent !== discountPercentDraft
    );
  }, [discountPercentDraft, draft, settings, shippingCentsDraft]);

  const fireDirty = useMemo(() => {
    if (!settings || !draft) return false;
    return (
      settings.fireEnabled !== draft.fireEnabled ||
      settings.fireIntensity !== draft.fireIntensity
    );
  }, [draft, settings]);

  const heroDirty = useMemo(() => {
    if (!settings || !draft) return false;
    const savedHeadline1 = settings.heroHeadlineColor1 ?? settings.heroHeadlineColor ?? null;
    const savedHeadline2 = settings.heroHeadlineColor2 ?? null;
    const draftHeadline1 = draft.heroHeadlineColor1UseDefault ? null : draft.heroHeadlineColor1;
    const draftHeadline2 = draft.heroHeadlineColor2UseDefault ? null : draft.heroHeadlineColor2;
    return (
      settings.heroHeadline !== draft.heroHeadline ||
      settings.heroHeadline2 !== draft.heroHeadline2 ||
      settings.heroSubtitle !== draft.heroSubtitle ||
      savedHeadline1 !== draftHeadline1 ||
      savedHeadline2 !== draftHeadline2
    );
  }, [draft, settings]);

  return (
    <AdminShell title="Settings">
      {error ? (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
          {success}
        </div>
      ) : null}

      {!settings || !draft ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Loading settings...
        </div>
      ) : (
        <div className="space-y-8">
          {/* General Information */}
          <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">General Information</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure basic site details.</p>
            </div>
            <div className="p-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Site Name"
                value={draft.siteName}
                onChange={(e) => setDraft((d) => (d ? { ...d, siteName: e.target.value } : d))}
                placeholder="My Ecom Store"
              />
              <Input
                label="Site Description"
                value={draft.siteDescription}
                onChange={(e) => setDraft((d) => (d ? { ...d, siteDescription: e.target.value } : d))}
                placeholder="The best place to shop..."
              />
            </div>
            <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4 flex justify-end dark:border-zinc-800 dark:bg-zinc-950">
              <Button
                disabled={saving || !basicDirty}
                onClick={async () => {
                  setSuccess(null);
                  setError(null);
                  setSaving(true);
                  try {
                    const next = await authedFetch<{ settings: AdminSettings }>("/api/admin/settings", {
                      method: "PUT",
                      body: JSON.stringify({
                        siteName: draft.siteName,
                        siteDescription: draft.siteDescription,
                      }),
                    });
                    setSettings(next.settings);
                    setDraft((d) => d ? {
                      ...d,
                      siteName: next.settings.siteName,
                      siteDescription: next.settings.siteDescription,
                    } : d);
                    await refreshPublicSettings();
                    setSuccess("Site details updated.");
                  } catch (e: unknown) {
                    setError(getErrorMessage(e, "Failed to save settings"));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Save Site Details"}
              </Button>
            </div>
          </section>

          {/* Hero Section Configuration */}
          <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Hero Section</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Customize the main landing page banner.</p>
            </div>
            <div className="p-6 space-y-6">
              <Input
                label="Headline (Orange Part)"
                value={draft.heroHeadline}
                onChange={(e) => setDraft((d) => (d ? { ...d, heroHeadline: e.target.value } : d))}
                placeholder="Achetez"
              />
              <Input
                label="Headline (White Part)"
                value={draft.heroHeadline2}
                onChange={(e) => setDraft((d) => (d ? { ...d, heroHeadline2: e.target.value } : d))}
                placeholder="des essentiels modernes avec livraison rapide."
              />
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2 dark:text-zinc-300">
                  Headline (Orange Part) Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-12 w-20 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
                    value={draft.heroHeadlineColor1}
                    disabled={draft.heroHeadlineColor1UseDefault}
                    onChange={(e) => setDraft((d) => (d ? { ...d, heroHeadlineColor1: e.target.value } : d))}
                  />
                  <div className="text-sm text-zinc-500 uppercase dark:text-zinc-400">
                    {draft.heroHeadlineColor1UseDefault ? "Default" : draft.heroHeadlineColor1}
                  </div>
                  <label className="ml-auto inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50/20"
                      checked={draft.heroHeadlineColor1UseDefault}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, heroHeadlineColor1UseDefault: e.target.checked } : d))
                      }
                    />
                    Use Accent Color
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2 dark:text-zinc-300">
                  Headline (White Part) Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-12 w-20 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
                    value={draft.heroHeadlineColor2}
                    disabled={draft.heroHeadlineColor2UseDefault}
                    onChange={(e) => setDraft((d) => (d ? { ...d, heroHeadlineColor2: e.target.value } : d))}
                  />
                  <div className="text-sm text-zinc-500 uppercase dark:text-zinc-400">
                    {draft.heroHeadlineColor2UseDefault ? "Default" : draft.heroHeadlineColor2}
                  </div>
                  <label className="ml-auto inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-50/20"
                      checked={draft.heroHeadlineColor2UseDefault}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, heroHeadlineColor2UseDefault: e.target.checked } : d))
                      }
                    />
                    Use Default Text Color
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Subtitle</label>
                <textarea
                  className="min-h-[100px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700 dark:focus:ring-zinc-50/10"
                  value={draft.heroSubtitle}
                  onChange={(e) => setDraft((d) => (d ? { ...d, heroSubtitle: e.target.value } : d))}
                  placeholder="Découvrez les produits..."
                />
              </div>
            </div>
            <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4 flex justify-end dark:border-zinc-800 dark:bg-zinc-950">
              <Button
                disabled={saving || !heroDirty}
                onClick={async () => {
                  setSuccess(null);
                  setError(null);
                  setSaving(true);
                  try {
                    const body: Record<string, unknown> = {
                      heroHeadline: draft.heroHeadline,
                      heroHeadline2: draft.heroHeadline2,
                      heroSubtitle: draft.heroSubtitle,
                      heroHeadlineColor1: draft.heroHeadlineColor1UseDefault ? null : draft.heroHeadlineColor1,
                      heroHeadlineColor2: draft.heroHeadlineColor2UseDefault ? null : draft.heroHeadlineColor2,
                    };
                    if (draft.heroHeadlineColor1UseDefault) body.heroHeadlineColor = null;
                    const next = await authedFetch<{ settings: AdminSettings }>("/api/admin/settings", {
                      method: "PUT",
                      body: JSON.stringify(body),
                    });
                    setSettings(next.settings);
                    setDraft((d) => {
                      if (!d) return d;
                      const isDark = document.documentElement.classList.contains("dark");
                      const fallbackHeadline2 = isDark ? "#fafafa" : "#111827";
                      const savedHeadline1 = next.settings.heroHeadlineColor1 ?? next.settings.heroHeadlineColor;
                      const savedHeadline2 = next.settings.heroHeadlineColor2;
                      return {
                        ...d,
                        heroHeadline: next.settings.heroHeadline,
                        heroHeadline2: next.settings.heroHeadline2,
                        heroSubtitle: next.settings.heroSubtitle,
                        heroHeadlineColor1: savedHeadline1 ?? next.settings.accentColor,
                        heroHeadlineColor2: savedHeadline2 ?? fallbackHeadline2,
                        heroHeadlineColor1UseDefault: savedHeadline1 == null,
                        heroHeadlineColor2UseDefault: savedHeadline2 == null,
                      };
                    });
                    await refreshPublicSettings();
                    setSuccess("Hero section updated.");
                  } catch (e: unknown) {
                    setError(getErrorMessage(e, "Failed to save settings"));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Save Hero Settings"}
              </Button>
            </div>
          </section>

          {/* Branding */}
          <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Branding & Appearance</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Customize your store&apos;s look and feel.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2 dark:text-zinc-300">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-12 w-20 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
                      value={draft.primaryColor}
                      onChange={(e) => setDraft((d) => (d ? { ...d, primaryColor: e.target.value } : d))}
                    />
                    <div className="text-sm text-zinc-500 uppercase dark:text-zinc-400">{draft.primaryColor}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2 dark:text-zinc-300">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-12 w-20 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
                      value={draft.accentColor}
                      onChange={(e) => setDraft((d) => (d ? { ...d, accentColor: e.target.value } : d))}
                    />
                    <div className="text-sm text-zinc-500 uppercase dark:text-zinc-400">{draft.accentColor}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <label className="block text-sm font-medium text-zinc-900 mb-4 dark:text-zinc-300">Store Logo</label>
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <div className="shrink-0">
                    <div className="h-32 min-w-[8rem] w-auto overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center dark:border-zinc-800 dark:bg-zinc-950">
                      {settings.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={settings.logoUrl}
                          alt="Store Logo"
                          className="h-full w-auto object-contain p-2"
                        />
                      ) : (
                        <div className="w-32 flex items-center justify-center">
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">No logo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <Input
                      label="Logo Height (px)"
                      type="number"
                      min={1}
                      max={512}
                      step={1}
                      value={draft.logoHeightPx}
                      onChange={(e) => setDraft((d) => (d ? { ...d, logoHeightPx: e.target.value } : d))}
                    />
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-100 dark:hover:file:bg-zinc-700"
                        onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Recommended: PNG or SVG with transparent background.</p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        disabled={!logoFile || uploading}
                        onClick={async () => {
                          if (!logoFile) return;
                          setSuccess(null);
                          setError(null);
                          setUploading(true);
                          try {
                            const fd = new FormData();
                            fd.append("file", logoFile);
                            const img = await authedFetch<{ image: { url: string; publicId?: string } }>(
                              "/api/admin/uploads/logo",
                              { method: "POST", body: fd }
                            );
                            
                            // Ensure the URL is absolute if it's relative
                            const imageUrl = img.image.url.startsWith("http") 
                              ? img.image.url 
                              : new URL(img.image.url, window.location.origin).toString();

                            const next = await authedFetch<{ settings: AdminSettings }>("/api/admin/settings", {
                              method: "PUT",
                              body: JSON.stringify({
                                logoUrl: imageUrl,
                                logoPublicId: img.image.publicId ?? null,
                              }),
                            });
                            
                            setSettings(next.settings);
                            setDraft((d) => d ? {
                              ...d,
                              primaryColor: next.settings.primaryColor,
                              accentColor: next.settings.accentColor,
                            } : d);
                            setLogoFile(null);
                            await refreshPublicSettings();
                            setSuccess("Logo updated successfully.");
                          } catch (e: unknown) {
                            setError(getErrorMessage(e, "Failed to upload logo"));
                          } finally {
                            setUploading(false);
                          }
                        }}
                      >
                        {uploading ? "Uploading..." : "Upload New Logo"}
                      </Button>

                      {settings.logoUrl && (
                        <Button
                          variant="danger"
                          disabled={uploading}
                          onClick={async () => {
                            if (!confirm("Are you sure you want to remove the logo?")) return;
                            setSuccess(null);
                            setError(null);
                            setUploading(true);
                            try {
                              if (settings.logoPublicId) {
                                await authedFetch("/api/admin/uploads", {
                                  method: "DELETE",
                                  body: JSON.stringify({ publicId: settings.logoPublicId }),
                                });
                              }
                              const next = await authedFetch<{ settings: AdminSettings }>("/api/admin/settings", {
                                method: "PUT",
                                body: JSON.stringify({ logoUrl: null, logoPublicId: null }),
                              });
                              setSettings(next.settings);
                              await refreshPublicSettings();
                              setSuccess("Logo removed.");
                            } catch (e: unknown) {
                              setError(getErrorMessage(e, "Failed to remove logo"));
                            } finally {
                              setUploading(false);
                            }
                          }}
                        >
                          Remove Logo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4 flex justify-end dark:border-zinc-800 dark:bg-zinc-950">
               <Button
                disabled={saving || !generalDirty}
                onClick={async () => {
                  setSuccess(null);
                  setError(null);
                  setSaving(true);
                  try {
                    const next = await authedFetch<{ settings: AdminSettings }>("/api/admin/settings", {
                      method: "PUT",
                      body: JSON.stringify({
                        siteName: draft.siteName,
                        siteDescription: draft.siteDescription,
                        logoHeightPx: logoHeightPxDraft,
                        primaryColor: draft.primaryColor,
                        accentColor: draft.accentColor,
                      }),
                    });
                    setSettings(next.settings);
                    setDraft((d) => d ? {
                      ...d,
                      siteName: next.settings.siteName,
                      siteDescription: next.settings.siteDescription,
                      logoHeightPx: String(next.settings.logoHeightPx),
                      primaryColor: next.settings.primaryColor,
                      accentColor: next.settings.accentColor,
                      fireEnabled: next.settings.fireEnabled,
                      fireIntensity: next.settings.fireIntensity,
                    } : d);
                    await refreshPublicSettings();
                    setSuccess("General settings & branding updated.");
                  } catch (e: unknown) {
                    setError(getErrorMessage(e, "Failed to save settings"));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Background Effects</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Control the fire glow behind the site.</p>
            </div>
            <div className="p-6 space-y-6">
              <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Fire Background</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Adds a subtle animated ember glow.</div>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--brand-accent)]"
                  checked={draft.fireEnabled}
                  onChange={(e) => setDraft((d) => (d ? { ...d, fireEnabled: e.target.checked } : d))}
                />
              </label>

              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Fire Intensity</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">0 = off, 100 = very strong.</div>
                  </div>
                  <div className="text-sm font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">{draft.fireIntensity}%</div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={draft.fireIntensity}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, fireIntensity: Math.max(0, Math.min(100, Number(e.target.value))) } : d))
                  }
                  className="mt-4 w-full"
                  disabled={!draft.fireEnabled}
                />
              </div>
            </div>
            <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4 flex justify-end dark:border-zinc-800 dark:bg-zinc-950">
              <Button
                disabled={saving || !fireDirty}
                onClick={async () => {
                  setSuccess(null);
                  setError(null);
                  setSaving(true);
                  try {
                    const next = await authedFetch<{ settings: AdminSettings }>("/api/admin/settings", {
                      method: "PUT",
                      body: JSON.stringify({
                        fireEnabled: draft.fireEnabled,
                        fireIntensity: draft.fireIntensity,
                      }),
                    });
                    setSettings(next.settings);
                    setDraft((d) => d ? {
                      ...d,
                      fireEnabled: next.settings.fireEnabled,
                      fireIntensity: next.settings.fireIntensity,
                    } : d);
                    await refreshPublicSettings();
                    setSuccess("Background updated.");
                  } catch (e: unknown) {
                    setError(getErrorMessage(e, "Failed to save settings"));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Save Background"}
              </Button>
            </div>
          </section>

          {/* Checkout */}
          <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
             <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Checkout Configuration</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage shipping costs and global discounts.</p>
            </div>
            <div className="p-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Shipping Price (DT)"
                inputMode="decimal"
                value={draft.shippingMad}
                onChange={(e) => setDraft((d) => (d ? { ...d, shippingMad: e.target.value } : d))}
              />
              <Input
                label="Global Discount (%)"
                inputMode="numeric"
                value={draft.discountPercent}
                onChange={(e) => setDraft((d) => (d ? { ...d, discountPercent: e.target.value } : d))}
              />
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Current: Shipping{" "}
                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatMoney(settings.shippingCents)}
                </strong>
                , Discount{" "}
                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {settings.discountPercent}%
                </strong>
              </p>
            </div>
            <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4 flex justify-end dark:border-zinc-800 dark:bg-zinc-950">
              <Button
                disabled={saving || shippingCentsDraft === null || discountPercentDraft === null || !checkoutDirty}
                onClick={async () => {
                  setSuccess(null);
                  setError(null);
                  setSaving(true);
                  try {
                    const next = await authedFetch<{ settings: AdminSettings }>("/api/admin/settings", {
                      method: "PUT",
                      body: JSON.stringify({
                        shippingCents: shippingCentsDraft,
                        discountPercent: discountPercentDraft,
                      }),
                    });
                    setSettings(next.settings);
                    setDraft((d) => d ? {
                      ...d,
                      shippingMad: (next.settings.shippingCents / 100).toFixed(2),
                      discountPercent: String(next.settings.discountPercent),
                    } : d);
                    await refreshPublicSettings();
                    setSuccess("Checkout settings updated.");
                  } catch (e: unknown) {
                    setError(getErrorMessage(e, "Failed to save settings"));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Save Checkout Settings"}
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Admin Account</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Update your admin email and password.</p>
            </div>

            <div className="p-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-5 dark:border-zinc-800/70 dark:bg-zinc-950/20">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Change Email</div>
                <form
                  className="mt-4 space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSuccess(null);
                    setError(null);
                    if (!user) return;
                    const nextEmail = adminEmailDraft.trim();
                    if (!nextEmail || nextEmail.toLowerCase() === user.email.toLowerCase()) {
                      setError("Please enter a different email.");
                      return;
                    }
                    setAdminEmailSaving(true);
                    try {
                      await authedFetch("/api/auth/me", {
                        method: "PATCH",
                        body: JSON.stringify({
                          email: nextEmail,
                          currentPassword: adminEmailPassword,
                        }),
                      });
                      await refreshMe();
                      setAdminEmailPassword("");
                      setSuccess("Admin email updated.");
                    } catch (err: unknown) {
                      setError(getErrorMessage(err, "Failed to update email"));
                    } finally {
                      setAdminEmailSaving(false);
                    }
                  }}
                >
                  <Input
                    label="New email"
                    type="email"
                    autoComplete="email"
                    value={adminEmailDraft}
                    onChange={(e) => setAdminEmailDraft(e.target.value)}
                    disabled={adminEmailSaving}
                  />
                  <Input
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    value={adminEmailPassword}
                    onChange={(e) => setAdminEmailPassword(e.target.value)}
                    disabled={adminEmailSaving}
                  />
                  <Button disabled={adminEmailSaving || !adminEmailPassword.trim()} type="submit" className="w-full">
                    {adminEmailSaving ? "Saving..." : "Update Email"}
                  </Button>
                </form>
              </div>

              <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-5 dark:border-zinc-800/70 dark:bg-zinc-950/20">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Change Password</div>
                <form
                  className="mt-4 space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSuccess(null);
                    setError(null);
                    if (!adminPwNext.trim()) {
                      setError("Please enter a new password.");
                      return;
                    }
                    if (adminPwNext.length < 8) {
                      setError("Password must be at least 8 characters.");
                      return;
                    }
                    if (adminPwNext !== adminPwConfirm) {
                      setError("Passwords do not match.");
                      return;
                    }
                    setAdminPwSaving(true);
                    try {
                      await authedFetch("/api/auth/me", {
                        method: "PATCH",
                        body: JSON.stringify({
                          currentPassword: adminPwCurrent,
                          newPassword: adminPwNext,
                        }),
                      });
                      setAdminPwCurrent("");
                      setAdminPwNext("");
                      setAdminPwConfirm("");
                      setSuccess("Admin password updated.");
                    } catch (err: unknown) {
                      setError(getErrorMessage(err, "Failed to update password"));
                    } finally {
                      setAdminPwSaving(false);
                    }
                  }}
                >
                  <Input
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    value={adminPwCurrent}
                    onChange={(e) => setAdminPwCurrent(e.target.value)}
                    disabled={adminPwSaving}
                  />
                  <Input
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    value={adminPwNext}
                    onChange={(e) => setAdminPwNext(e.target.value)}
                    disabled={adminPwSaving}
                  />
                  <Input
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    value={adminPwConfirm}
                    onChange={(e) => setAdminPwConfirm(e.target.value)}
                    disabled={adminPwSaving}
                  />
                  <Button
                    disabled={adminPwSaving || !adminPwCurrent.trim()}
                    type="submit"
                    className="w-full"
                    variant="secondary"
                  >
                    {adminPwSaving ? "Saving..." : "Update Password"}
                  </Button>
                </form>
              </div>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
