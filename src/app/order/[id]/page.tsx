"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { Container } from "../../../components/Container";
import { useAuth } from "../../../lib/auth";
import { apiFetch, getErrorMessage } from "../../../lib/api";
import { useI18n } from "../../../lib/i18n";
import { formatMoney } from "../../../lib/money";

type Shipping = {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  notes?: string | null;
};

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  product: { slug: string; images: { url: string }[] } | null;
};

type Order = {
  id: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELED";
  currency: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  shipping: Shipping;
  items: OrderItem[];
  payment: { method: "COD"; status: "PENDING" | "PAID" | "FAILED" } | null;
};

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OrderInner id={id} />;
}

function OrderInner({ id }: { id: string }) {
  const { authedFetch, user } = useAuth();
  const { t } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (user
      ? authedFetch<{ order: Order }>(`/api/orders/${id}`)
      : apiFetch<{ order: Order }>(`/api/orders/public/${id}`)
    )
      .then((d) => setOrder(d.order))
      .catch((e: unknown) => setError(getErrorMessage(e, "Failed to load order")));
  }, [authedFetch, id, user]);

  return (
    <main className="py-10 md:py-12">
      <Container>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("order.title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t("order.orderId", { id })}</p>
          </div>
          {user ? (
            <Link href="/account" className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
              {t("order.backToAccount")}
            </Link>
          ) : null}
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {!order ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-300">{t("order.loading")}</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 rounded-2xl border border-zinc-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/50">
              <div className="border-b border-zinc-200/70 p-5 dark:border-[color:var(--divider-subtle)]">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t("order.items")}</div>
              </div>
              <div className="divide-y divide-zinc-200/70 dark:divide-[color:var(--divider-subtle)]">
                {order.items.map((i) => {
                  const first = i.product?.images?.[0]?.url;
                  const failed = imgFailed[i.id] ?? false;
                  return (
                    <div key={i.id} className="flex gap-4 p-5">
                      <div className="h-16 w-16 overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                        {first && !failed ? (
                          <Image
                            src={first}
                            alt={i.name}
                            width={160}
                            height={160}
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
                            {t("products.noImage")}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {i.product?.slug ? (
                          <Link
                            href={`/products/${i.product.slug}`}
                            className="block break-words font-medium text-zinc-900 dark:text-zinc-100"
                          >
                            {i.name}
                          </Link>
                        ) : (
                          <div className="break-words font-medium text-zinc-900 dark:text-zinc-100">{i.name}</div>
                        )}
                        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {i.quantity} × {formatMoney(i.unitPriceCents, order.currency)}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatMoney(i.lineTotalCents, order.currency)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/50">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t("order.summary")}</div>
              <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("order.status")}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{order.status}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("order.payment")}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {order.payment?.method ?? "COD"} ({order.payment?.status ?? "PENDING"})
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("order.subtotal")}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatMoney(order.subtotalCents, order.currency)}</span>
                </div>
                {order.discountCents > 0 ? (
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">{t("order.discount")}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">-{formatMoney(order.discountCents, order.currency)}</span>
                  </div>
                ) : null}
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("order.shipping")}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatMoney(order.shippingCents, order.currency)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-200/70 pt-4 dark:border-[color:var(--divider-subtle)]">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("order.total")}</span>
                  <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatMoney(order.totalCents, order.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
