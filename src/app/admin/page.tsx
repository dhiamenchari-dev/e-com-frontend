"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../../components/AdminShell";
import { RequireAdmin } from "../../components/RequireAuth";
import { useAuth } from "../../lib/auth";
import { getErrorMessage } from "../../lib/api";
import { formatMoney } from "../../lib/money";

type Stats = { users: number; orders: number; revenueCents: number; currency: string };

export default function AdminDashboardPage() {
  return (
    <RequireAdmin>
      <AdminDashboardInner />
    </RequireAdmin>
  );
}

function AdminDashboardInner() {
  const { authedFetch } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch<Stats>("/api/admin/stats")
      .then(setStats)
      .catch((e: unknown) => setError(getErrorMessage(e, "Failed to load stats")));
  }, [authedFetch]);

  return (
    <AdminShell title="Dashboard">
      {error ? <div className="mb-4 text-sm text-red-600">{error}</div> : null}
      {!stats ? (
        <div className="text-sm text-zinc-600">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Users</div>
            <div className="mt-2 text-2xl font-semibold">{stats.users}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Orders</div>
            <div className="mt-2 text-2xl font-semibold">{stats.orders}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Revenue</div>
            <div className="mt-2 text-2xl font-semibold">
              {formatMoney(stats.revenueCents, stats.currency)}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
