"use client";

import { use, useEffect, useState } from "react";
import type { Product } from "../../../lib/types";
import { Container } from "../../../components/Container";
import { formatMoney } from "../../../lib/money";
import { AddToCartButton } from "../../../components/AddToCartButton";
import { apiFetch, getErrorMessage, getErrorStatus } from "../../../lib/api";
import { useI18n } from "../../../lib/i18n";
import { getProductPrice } from "../../../lib/product";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = useI18n();
  const { slug } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const t = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      apiFetch<{ product: Product }>(`/api/products/${encodeURIComponent(slug)}`, {
        signal: controller.signal,
      })
        .then((d) => setProduct(d.product))
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          if (getErrorStatus(e) === 404) {
            setNotFound(true);
            return;
          }
          setError(getErrorMessage(e, "Failed to load product"));
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          setLoading(false);
        });
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [slug]);

  const first = product?.images?.[0]?.url;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const priceInfo = product ? getProductPrice(product) : null;

  return (
    <main className="py-10 md:py-12">
      <Container>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {loading && !product ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-3xl border border-zinc-200/70 bg-white/60 dark:border-[color:var(--divider-subtle)] dark:bg-zinc-900/40" />
            <div className="space-y-3">
              <div className="h-5 w-24 animate-pulse rounded bg-zinc-200/60" />
              <div className="h-10 w-3/4 animate-pulse rounded bg-zinc-200/60" />
              <div className="h-7 w-40 animate-pulse rounded bg-zinc-200/60" />
              <div className="h-11 w-44 animate-pulse rounded-xl bg-zinc-200/60" />
              <div className="mt-6 h-40 animate-pulse rounded-2xl border border-zinc-200/70 bg-white/60 dark:border-[color:var(--divider-subtle)] dark:bg-zinc-900/40" />
            </div>
          </div>
        ) : notFound ? (
          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-6 text-sm text-zinc-700 shadow-sm backdrop-blur dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/50 dark:text-zinc-200">
            {t("products.notFound")}
          </div>
        ) : !product ? null : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/50">
              <div className="aspect-square w-full bg-zinc-50 dark:bg-zinc-900">
                {first && failedSrc !== first ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={first}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={() => setFailedSrc(first)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                    {t("products.noImage")}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/50">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{product.category?.name}</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{product.name}</h1>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col items-start">
                  {priceInfo?.hasDiscount && (
                    <span className="text-sm text-zinc-500 line-through dark:text-zinc-400">
                      {formatMoney(priceInfo.originalPrice)}
                    </span>
                  )}
                  <div
                    className={`text-2xl font-semibold ${
                      priceInfo?.hasDiscount ? "text-red-600" : "text-zinc-950 dark:text-zinc-50"
                    }`}
                  >
                    {formatMoney(priceInfo?.price ?? product.priceCents)}
                  </div>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  {product.stock > 0
                    ? t("products.inStock", { count: product.stock })
                    : t("products.outOfStock")}
                </div>
              </div>

              <div className="mt-6">
                <AddToCartButton className="w-full" productId={product.id} disabled={product.stock <= 0} />
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-200/70 bg-white/70 p-5 dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/40">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t("products.description")}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                  {product.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
