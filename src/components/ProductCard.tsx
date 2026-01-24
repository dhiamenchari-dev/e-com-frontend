"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "../lib/types";
import { formatMoney } from "../lib/money";
import { useI18n } from "../lib/i18n";
import { getProductPrice } from "../lib/product";

export function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n();
  const first = product.images?.[0]?.url;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const { price, originalPrice, hasDiscount, discountPercentage } = getProductPrice(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="ui-panel group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      onMouseEnter={() => {
        window.dispatchEvent(
          new CustomEvent("fire:hover", { detail: { active: true, amount: 0.12 } })
        );
      }}
      onMouseLeave={() => {
        window.dispatchEvent(new CustomEvent("fire:hover", { detail: { active: false } }));
      }}
      onFocus={() => {
        window.dispatchEvent(
          new CustomEvent("fire:hover", { detail: { active: true, amount: 0.08 } })
        );
      }}
      onBlur={() => {
        window.dispatchEvent(new CustomEvent("fire:hover", { detail: { active: false } }));
      }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {hasDiscount && (
          <div className="absolute top-2 right-2 z-10 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
            -{Math.round(discountPercentage || 0)}%
          </div>
        )}
        {first && failedSrc !== first ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={first}
              alt={product.name}
              className="h-full w-full object-cover transition duration-700 ease-in-out group-hover:scale-105"
              onError={() => setFailedSrc(first)}
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            
            {/* Quick Action Button */}
            <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <button
                type="button"
                className="w-full rounded-xl border border-white/50 bg-white/90 py-3 text-sm font-semibold text-zinc-900 shadow-lg backdrop-blur transition-transform hover:scale-[1.02] active:scale-[0.98] dark:border-[color:var(--divider-subtle)] dark:bg-zinc-900/80 dark:text-zinc-100"
              >
                {t("products.viewDetails") || "View Details"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
            {t("products.noImage")}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex justify-between items-start gap-2">
          <h3 className="break-words text-lg font-medium text-zinc-900 transition-colors group-hover:text-[var(--brand-accent)] dark:text-zinc-100 sm:line-clamp-1">
            {product.name}
          </h3>
          <div className="flex flex-col items-end">
            {hasDiscount && (
              <span className="text-xs text-zinc-500 line-through">
                {formatMoney(originalPrice)}
              </span>
            )}
            <p className={`text-lg font-bold ${hasDiscount ? "text-red-600" : "text-zinc-900 dark:text-zinc-100"} shrink-0`}>
              {formatMoney(price)}
            </p>
          </div>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {product.category?.name}
        </p>
      </div>
    </Link>
  );
}
