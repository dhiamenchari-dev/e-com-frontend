"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Container } from "../../components/Container";
import { Button } from "../../components/Button";
import { useCart } from "../../lib/cart";
import { useI18n } from "../../lib/i18n";
import { useSettings } from "../../lib/settings";
import { formatMoney } from "../../lib/money";
import { getProductPrice } from "../../lib/product";

export default function CartPage() {
  return <CartInner />;
}

function CartInner() {
  const { cart, isLoading, updateItemQuantity, removeItem, subtotalCents } = useCart();
  const { t } = useI18n();
  const { settings } = useSettings();
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  const shippingCents = settings?.shippingCents ?? 0;
  const discountPercent = settings?.discountPercent ?? 0;
  const discountCents =
    discountPercent > 0 ? Math.round((subtotalCents * Math.min(90, Math.max(0, discountPercent))) / 100) : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);

  return (
    <main className="py-10 md:py-12">
      <Container>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{t("cart.title")}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t("cart.subtitle")}</p>
          </div>
          <Link href="/products" className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
            {t("cart.continueShopping")}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-28 animate-pulse rounded-2xl border border-zinc-200/70 bg-white/60 dark:bg-zinc-800/60 dark:border-zinc-700"
                />
              ))}
            </div>
            <div className="h-56 animate-pulse rounded-2xl border border-zinc-200/70 bg-white/60 dark:bg-zinc-800/60 dark:border-zinc-700" />
          </div>
        ) : !cart?.items?.length ? (
          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 dark:bg-zinc-800/80 dark:border-[color:var(--divider-subtle)] p-6 shadow-sm backdrop-blur">
            <div className="text-sm text-zinc-700 dark:text-zinc-300">{t("cart.empty")}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="rounded-2xl border border-zinc-200/70 bg-white/80 dark:bg-zinc-800/80 dark:border-[color:var(--divider-subtle)] shadow-sm backdrop-blur">
                <div className="divide-y divide-zinc-200/70 dark:divide-[color:var(--divider-subtle)]">
                  {cart.items.map((i) => {
                    const first = i.product.images?.[0]?.url;
                    const failed = imgFailed[i.id] ?? false;
                    const priceInfo = getProductPrice(i.product);
                    return (
                      <div key={i.id} className="flex gap-4 p-4">
                        <div className="h-20 w-20 overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700">
                          {first && !failed ? (
                            <Image
                              src={first}
                              alt={i.product.name}
                              width={200}
                              height={200}
                              className="h-full w-full object-cover"
                              onError={() =>
                                setImgFailed((prev) => ({
                                  ...prev,
                                  [i.id]: true,
                                }))
                              }
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                              {t("cart.noImage")}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              href={`/products/${i.product.slug}`}
                              className="block break-words font-medium text-zinc-900 dark:text-zinc-100"
                            >
                              {i.product.name}
                            </Link>
                            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                              {priceInfo.hasDiscount ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500 line-through">
                                    {formatMoney(priceInfo.originalPrice)}
                                  </span>
                                  <span className="font-semibold text-red-600">{formatMoney(priceInfo.price)}</span>
                                </div>
                              ) : (
                                formatMoney(i.product.priceCents)
                              )}
                            </div>
                            {!i.product.isActive ? (
                              <div className="mt-2 text-sm text-red-600">{t("cart.productInactive")}</div>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              className="h-10 rounded-xl border border-zinc-200 bg-white px-2 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                              value={i.quantity}
                              onChange={(e) => updateItemQuantity(i.id, Number(e.target.value))}
                            >
                              {Array.from({ length: Math.min(10, i.product.stock || 10) }).map(
                                (_, idx) => (
                                  <option key={idx + 1} value={idx + 1}>
                                    {idx + 1}
                                  </option>
                                )
                              )}
                            </select>
                            <Button variant="ghost" onClick={() => removeItem(i.id)} className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                              {t("cart.remove")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 dark:bg-zinc-900/80 dark:border-zinc-800/70 p-5 shadow-sm backdrop-blur">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t("cart.summary")}</div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="text-zinc-600 dark:text-zinc-400">{t("cart.subtotal")}</div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{formatMoney(subtotalCents)}</div>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <div className="text-zinc-600 dark:text-zinc-400">{t("cart.shipping")}</div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{formatMoney(shippingCents)}</div>
              </div>
              {discountCents > 0 ? (
                <div className="mt-1 flex items-center justify-between text-sm">
                  <div className="text-zinc-600 dark:text-zinc-400">{t("cart.discount")}</div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">-{formatMoney(discountCents)}</div>
                </div>
              ) : null}
              <div className="mt-4 flex items-center justify-between border-t border-zinc-200/70 dark:border-zinc-800/70 pt-4 text-sm">
                <div className="text-zinc-600 dark:text-zinc-400">{t("cart.total")}</div>
                <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatMoney(totalCents)}</div>
              </div>
              <Link href="/checkout" className="mt-5 block">
                <Button className="w-full">{t("cart.checkout")}</Button>
              </Link>
              <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {t("cart.paymentHint")}
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
