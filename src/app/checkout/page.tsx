"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../../components/Button";
import { Container } from "../../components/Container";
import { Input } from "../../components/Input";
import { useAuth } from "../../lib/auth";
import { apiFetch, getErrorMessage } from "../../lib/api";
import { useCart } from "../../lib/cart";
import { useI18n } from "../../lib/i18n";
import { useSettings } from "../../lib/settings";
import { formatMoney } from "../../lib/money";

type Shipping = {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  notes?: string;
};

export default function CheckoutPage() {
  return <CheckoutInner />;
}

function CheckoutInner() {
  const router = useRouter();
  const { authedFetch, user } = useAuth();
  const { cart, subtotalCents, refresh, clear } = useCart();
  const { t } = useI18n();
  const { settings } = useSettings();
  const [shipping, setShipping] = useState<Shipping>({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCheckout = (cart?.items?.length ?? 0) > 0;
  const shippingCents = settings?.shippingCents ?? 0;
  const discountPercent = settings?.discountPercent ?? 0;
  const discountCents =
    discountPercent > 0 ? Math.round((subtotalCents * Math.min(90, Math.max(0, discountPercent))) / 100) : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);

  return (
    <main className="py-10 md:py-12">
      <Container>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("checkout.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t("checkout.subtitle")}</p>
        </div>

        {!canCheckout ? (
          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-6 text-sm text-zinc-700 shadow-sm backdrop-blur dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/50 dark:text-zinc-200">
            {t("checkout.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <form
              className="md:col-span-2 rounded-2xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/50"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setIsSubmitting(true);
                try {
                  const payload = {
                    shipping: {
                      fullName: shipping.fullName.trim(),
                      phone: shipping.phone.trim(),
                      addressLine1: shipping.addressLine1.trim(),
                      city: shipping.city.trim(),
                      notes: shipping.notes?.trim() || undefined,
                    },
                  };
                  const data = user
                    ? await authedFetch<{ order: { id: string } }>("/api/orders/checkout", {
                        method: "POST",
                        body: JSON.stringify(payload),
                      })
                    : await apiFetch<{ order: { id: string } }>("/api/orders/guest-checkout", {
                        method: "POST",
                        body: JSON.stringify({
                          ...payload,
                          items: (cart?.items ?? []).map((i) => ({
                            productId: i.product.id,
                            quantity: i.quantity,
                          })),
                        }),
                      });
                  await clear();
                  await refresh();
                  router.push(`/order/${data.order.id}`);
                } catch (err: unknown) {
                  setError(getErrorMessage(err, "Checkout failed"));
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  label={t("checkout.fullName")}
                  value={shipping.fullName}
                  onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value }))}
                  required
                />
                <Input
                  label={t("checkout.phone")}
                  value={shipping.phone}
                  onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label={t("checkout.address1")}
                    value={shipping.addressLine1}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, addressLine1: e.target.value }))
                    }
                    required
                  />
                </div>
                <Input
                  label={t("checkout.city")}
                  value={shipping.city}
                  onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-300">
                    {t("checkout.notesOptional")}
                  </div>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus:border-[var(--brand-accent)] focus:ring-4 focus:ring-[var(--brand-accent)]/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                    value={shipping.notes ?? ""}
                    onChange={(e) => setShipping((s) => ({ ...s, notes: e.target.value }))}
                  />
                </label>
              </div>

              {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

              <div className="mt-6 flex items-center justify-end">
                <Button className="w-full md:w-auto" disabled={isSubmitting} type="submit">
                  {isSubmitting ? t("checkout.placingOrder") : t("checkout.placeOrder")}
                </Button>
              </div>
            </form>

            <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-[color:var(--divider-subtle)] dark:bg-zinc-950/50">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t("checkout.orderSummary")}</div>
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
              <div className="mt-4 flex items-center justify-between border-t border-zinc-200/70 pt-4 text-sm dark:border-[color:var(--divider-subtle)]">
                <div className="text-zinc-600 dark:text-zinc-400">{t("cart.total")}</div>
                <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatMoney(totalCents)}</div>
              </div>
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
