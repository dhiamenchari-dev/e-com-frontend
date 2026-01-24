"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { Container } from "../../components/Container";
import { Input } from "../../components/Input";
import { RequireAuth } from "../../components/RequireAuth";
import { useAuth } from "../../lib/auth";
import { getErrorMessage } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { formatMoney } from "../../lib/money";

type OrderListItem = {
  id: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELED";
  totalCents: number;
  currency: string;
  createdAt: string;
  items: { id: string; name: string; quantity: number; unitPriceCents: number }[];
};

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountInner />
    </RequireAuth>
  );
}

function AccountInner() {
  const { user, authedFetch, logout, refreshMe } = useAuth();
  const { t } = useI18n();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  useEffect(() => {
    authedFetch<{ items: OrderListItem[] }>("/api/orders/my?page=1&limit=20")
      .then((d) => setOrders(d.items))
      .finally(() => setLoading(false));
  }, [authedFetch]);

  useEffect(() => {
    setEmailDraft(user?.email ?? "");
  }, [user?.email]);

  return (
    <main className="py-10">
      <Container>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("account.title")}</h1>
            <p className="mt-1 text-sm text-zinc-600">{user?.email}</p>
          </div>
          <button className="text-sm font-medium text-zinc-900 hover:underline" onClick={() => logout()}>
            {t("nav.logout")}
          </button>
        </div>


        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="text-sm font-semibold">{t("account.profile")}</div>
            <div className="mt-3 space-y-2 text-sm text-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">{t("account.name")}</span>
                <span className="font-medium">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">{t("account.role")}</span>
                <span className="font-medium">{user?.role}</span>
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-200/70 pt-5">
              <div className="text-sm font-semibold text-zinc-900">{t("account.security")}</div>

              <form
                className="mt-4 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEmailError(null);
                  setEmailSuccess(null);
                  if (!user) return;
                  if (!emailDraft.trim() || emailDraft.trim().toLowerCase() === user.email.toLowerCase()) {
                    setEmailError(t("account.emailNoChange"));
                    return;
                  }
                  setEmailSaving(true);
                  try {
                    await authedFetch("/api/auth/me", {
                      method: "PATCH",
                      body: JSON.stringify({
                        email: emailDraft.trim(),
                        currentPassword: emailPassword,
                      }),
                    });
                    await refreshMe();
                    setEmailPassword("");
                    setEmailSuccess(t("account.emailUpdated"));
                  } catch (err: unknown) {
                    setEmailError(getErrorMessage(err, t("account.updateFailed")));
                  } finally {
                    setEmailSaving(false);
                  }
                }}
              >
                <Input
                  label={t("account.newEmail")}
                  type="email"
                  autoComplete="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                />
                <Input
                  label={t("account.currentPassword")}
                  type="password"
                  autoComplete="current-password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                />
                {emailError ? <div className="text-sm text-red-600">{emailError}</div> : null}
                {emailSuccess ? <div className="text-sm text-emerald-700">{emailSuccess}</div> : null}
                <Button disabled={emailSaving || !emailPassword.trim()} type="submit" className="w-full">
                  {emailSaving ? t("account.saving") : t("account.updateEmail")}
                </Button>
              </form>

              <form
                className="mt-6 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setPwError(null);
                  setPwSuccess(null);
                  if (!pwNext.trim()) {
                    setPwError(t("account.passwordRequired"));
                    return;
                  }
                  if (pwNext.length < 8) {
                    setPwError(t("account.passwordTooShort"));
                    return;
                  }
                  if (pwNext !== pwConfirm) {
                    setPwError(t("account.passwordMismatch"));
                    return;
                  }
                  setPwSaving(true);
                  try {
                    await authedFetch("/api/auth/me", {
                      method: "PATCH",
                      body: JSON.stringify({
                        currentPassword: pwCurrent,
                        newPassword: pwNext,
                      }),
                    });
                    setPwCurrent("");
                    setPwNext("");
                    setPwConfirm("");
                    setPwSuccess(t("account.passwordUpdated"));
                  } catch (err: unknown) {
                    setPwError(getErrorMessage(err, t("account.updateFailed")));
                  } finally {
                    setPwSaving(false);
                  }
                }}
              >
                <Input
                  label={t("account.currentPassword")}
                  type="password"
                  autoComplete="current-password"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                />
                <Input
                  label={t("account.newPassword")}
                  type="password"
                  autoComplete="new-password"
                  value={pwNext}
                  onChange={(e) => setPwNext(e.target.value)}
                />
                <Input
                  label={t("account.confirmNewPassword")}
                  type="password"
                  autoComplete="new-password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                />
                {pwError ? <div className="text-sm text-red-600">{pwError}</div> : null}
                {pwSuccess ? <div className="text-sm text-emerald-700">{pwSuccess}</div> : null}
                <Button disabled={pwSaving || !pwCurrent.trim()} type="submit" className="w-full" variant="secondary">
                  {pwSaving ? t("account.saving") : t("account.updatePassword")}
                </Button>
              </form>
            </div>
          </div>

          <div className="md:col-span-2 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 shadow-sm backdrop-blur">
            <div className="border-b border-zinc-200/70 p-5">
              <div className="text-sm font-semibold">{t("account.orderHistory")}</div>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-20 animate-pulse rounded-xl border border-zinc-200/70 bg-white/60"
                  />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-5 text-sm text-zinc-700">{t("account.noOrders")}</div>
            ) : (
              <div className="divide-y divide-zinc-200/70">
                {orders.map((o) => (
                  <div key={o.id} className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{t("account.order", { id: o.id })}</div>
                        <div className="mt-1 text-sm text-zinc-600">
                          {new Date(o.createdAt).toLocaleString()} · {o.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold">{formatMoney(o.totalCents, o.currency)}</div>
                        <Link
                          href={`/order/${o.id}`}
                          className="rounded-lg px-2 py-1 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                        >
                          {t("account.view")}
                        </Link>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-zinc-600">
                      {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
