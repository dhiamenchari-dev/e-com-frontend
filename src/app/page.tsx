"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Container } from "../components/Container";
import { ProductCard } from "../components/ProductCard";
import { apiFetch } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useSettings } from "../lib/settings";
import type { Product } from "../lib/types";

// Icons components
const TruckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 17h4" />
    <path d="M2 17h2" />
    <path d="M18 17h2" />
    <path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
    <path d="M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
    <path d="M15 9h6l3 5v5h-2" />
    <path d="M2 3h13v12H2z" />
    <path d="M9 3v4" />
    <path d="M5 3v4" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const HeadsetIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
    <path d="M21 16v2a4 4 0 0 1-4 4h-5" />
  </svg>
);

export default function Home() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const { settings } = useSettings();

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      apiFetch<{ items: Product[] }>("/api/products/featured", {
        signal: controller.signal,
      })
        .then((d) => setItems(d.items))
        .catch(() => {})
        .finally(() => {
          if (controller.signal.aborted) return;
          setLoading(false);
        });
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <main className="pb-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_35%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.01)_35%,transparent_72%)]" />
        <div className="hero-flame" aria-hidden />

        <Container>
          <div className="relative z-10 flex min-h-[calc(100svh-5rem)] items-center justify-center py-14 md:py-20">
            <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] md:p-12">
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-6xl">
                <span className="block" style={{ color: "var(--hero-headline-1)" }}>
                  {settings?.heroHeadline || t("home.heroTitle").split(" ")[0]}
                </span>
                <span style={{ color: "var(--hero-headline-2)" }}>
                  {settings?.heroHeadline2 || t("home.heroTitle").split(" ").slice(1).join(" ")}
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-700 dark:text-zinc-200 sm:text-xl">
                {settings?.heroSubtitle || t("home.heroSubtitle")}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-x-6">
                <Link href="/products" className="w-full sm:w-auto">
                  <Button className="h-14 w-full px-10 text-lg shadow-xl shadow-black/25 sm:w-auto rounded-2xl">
                    {t("home.browseProducts")}
                  </Button>
                </Link>
                <Link href="/cart" className="w-full sm:w-auto">
                  <Button className="h-14 w-full px-10 text-lg sm:w-auto rounded-2xl" variant="secondary">
                    {t("home.viewCart")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="border-y border-zinc-200 bg-white/50 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50 py-16">
        <Container>
          <div className="flex gap-6 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-12 md:overflow-visible md:pb-0">
            {[
              {
                icon: <TruckIcon />,
                title: t("home.features.fastDelivery.title"),
                desc: t("home.features.fastDelivery.desc"),
                color: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
              },
              {
                icon: <ShieldCheckIcon />,
                title: t("home.features.cod.title"),
                desc: t("home.features.cod.desc"),
                color: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
              },
              {
                icon: <HeadsetIcon />,
                title: t("home.features.support.title"),
                desc: t("home.features.support.desc"),
                color: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex min-w-[240px] shrink-0 flex-col items-center text-center group md:min-w-0"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${feature.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {feature.title}
                </h3>
                <p className="mt-3 text-base text-zinc-600 dark:text-zinc-300">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured Products */}
      <section className="py-24">
        <Container>
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                {t("home.featured")}
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300 max-w-xl">
                {t("home.featuredSubtitle")}
              </p>
            </div>
            <Link
              href="/products"
              className="group flex items-center gap-2 text-base font-semibold text-[var(--brand-accent)] hover:text-[var(--brand-accent-hover)]"
            >
              {t("home.viewAll")}
              <span className="transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[300px] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Newsletter Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
         <div className="absolute inset-0 bg-[radial-gradient(#ffffff1a_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
        <Container>
          <div className="relative isolate overflow-hidden px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16 bg-zinc-900/80 ring-1 ring-white/10 backdrop-blur-3xl">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Subscribe to our newsletter
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-300">
              Get the latest updates on new products, exclusive offers, and upcoming sales directly in your inbox.
            </p>
            <div className="mx-auto mt-10 flex w-full max-w-md flex-col gap-4 sm:flex-row">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="min-w-0 flex-auto rounded-xl border-0 bg-white/5 px-4 py-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-[var(--brand-accent)] sm:text-sm sm:leading-6 placeholder:text-zinc-400"
                placeholder="Enter your email"
              />
              <button
                type="submit"
                className="flex-none rounded-xl bg-[var(--brand-accent)] px-6 py-3 text-sm font-semibold text-[var(--brand-accent-foreground)] shadow-sm hover:bg-[var(--brand-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 transition-all hover:scale-105"
              >
                Subscribe
              </button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
