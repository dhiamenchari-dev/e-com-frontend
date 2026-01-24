"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useI18n } from "../lib/i18n";
import { useSettings } from "../lib/settings";
import { Button } from "./Button";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { user, isReady, logout } = useAuth();
  const { itemsCount } = useCart();
  const { lang, setLang, t } = useI18n();
  const { settings } = useSettings();
  const siteName = settings?.siteName ?? "Ecom";
  const siteNameTrimmed = siteName.trim();
  const showSiteName = siteNameTrimmed.length > 0;
  const logoHeightPx = Math.max(1, Math.min(512, settings?.logoHeightPx ?? 40));
  const logoInitial = (siteNameTrimmed.slice(0, 1) || "E").toUpperCase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled 
          ? "border-b border-zinc-200/70 bg-white/80 shadow-sm backdrop-blur-xl dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/80" 
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <Container>
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight text-zinc-950 dark:text-zinc-50 text-xl group">
            {settings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt={showSiteName ? siteNameTrimmed : "Logo"}
                style={{ height: logoHeightPx }}
                className="w-auto object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <span
                className="grid place-items-center overflow-hidden rounded-xl bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)] shadow-md transition-transform group-hover:scale-105 group-hover:rotate-3"
                style={{ height: logoHeightPx, width: logoHeightPx }}
              >
                {logoInitial}
              </span>
            )}
            {showSiteName ? (
              <span className="max-w-[12rem] truncate sm:max-w-[16rem]">
                {siteNameTrimmed}
              </span>
            ) : null}
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-zinc-200/50 bg-white/50 p-1.5 text-sm font-medium shadow-sm backdrop-blur-md dark:border-[color:var(--divider-subtle)] dark:bg-zinc-900/50 md:flex">
            <Link href="/products" className="rounded-full px-4 py-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
              {t("nav.shop")}
            </Link>
            <Link href="/cart" className="relative rounded-full px-4 py-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
              {t("nav.cart")}
              {itemsCount ? (
                <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--brand-accent)] text-[10px] font-bold text-[var(--brand-accent-foreground)] shadow-sm ring-2 ring-white dark:ring-zinc-900 animate-scale-in">
                  {itemsCount}
                </span>
              ) : null}
            </Link>
            {user ? (
              <Link href="/account" className="rounded-full px-4 py-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
                {t("nav.account")}
              </Link>
            ) : null}
            {user?.role === "ADMIN" ? (
              <Link href="/admin" className="rounded-full px-4 py-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
                {t("nav.admin")}
              </Link>
            ) : null}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <label className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 shadow-sm transition-colors hover:border-zinc-300 dark:border-[color:var(--divider-subtle)] dark:bg-zinc-900 dark:text-zinc-400 md:flex">
              <span className="text-zinc-400 dark:text-zinc-500">{t("nav.language")}</span>
              <select
                className="bg-transparent outline-none font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
                value={lang}
                onChange={(e) => setLang(e.target.value === "fr" ? "fr" : "en")}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </label>
            {!isReady ? null : user ? (
              <Button variant="ghost" onClick={() => logout()} className="rounded-full text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                {t("nav.logout")}
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                  {t("nav.login")}
                </Link>
                <Link href="/auth/register">
                  <Button className="rounded-full px-6">{t("nav.register")}</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <Link
              href="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm dark:border-[color:var(--divider-subtle)] dark:bg-zinc-900 dark:text-zinc-300"
              onClick={() => setMobileOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {itemsCount ? (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--brand-accent)] text-[10px] font-bold text-[var(--brand-accent-foreground)] shadow-sm ring-2 ring-white dark:ring-zinc-900">
                  {itemsCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-[color:var(--divider-subtle)] dark:bg-zinc-900 dark:text-zinc-100"
              aria-expanded={mobileOpen}
              aria-label="Menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="pb-4 md:hidden animate-fade-in-up">
            <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl dark:border-[color:var(--divider-subtle)] dark:bg-zinc-900/90">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("nav.language")}</div>
                <select
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-[color:var(--divider-subtle)] dark:bg-zinc-900 dark:text-zinc-100"
                  value={lang}
                  onChange={(e) => setLang(e.target.value === "fr" ? "fr" : "en")}
                >
                  <option value="en">EN</option>
                  <option value="fr">FR</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Link
                  href="/products"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm dark:border-[color:var(--divider-subtle)] dark:bg-zinc-800 dark:text-zinc-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.shop")}
                </Link>
                {user ? (
                  <Link
                    href="/account"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm dark:border-[color:var(--divider-subtle)] dark:bg-zinc-800 dark:text-zinc-100"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.account")}
                  </Link>
                ) : null}
                {user?.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm dark:border-[color:var(--divider-subtle)] dark:bg-zinc-800 dark:text-zinc-100"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.admin")}
                  </Link>
                ) : null}

                {!isReady ? null : user ? (
                  <button
                    type="button"
                    className="rounded-xl bg-[var(--brand-accent)] px-4 py-3 text-left text-sm font-medium text-[var(--brand-accent-foreground)] shadow-sm hover:bg-[var(--brand-accent-hover)]"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                  >
                    {t("nav.logout")}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link
                      href="/auth/login"
                      className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm dark:border-[color:var(--divider-subtle)] dark:bg-zinc-800 dark:text-zinc-100"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      href="/auth/register"
                      className="flex items-center justify-center rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-medium text-[var(--brand-primary-foreground)] shadow-sm"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("nav.register")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Container>
    </header>
  );
}
