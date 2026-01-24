"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../../../components/AdminShell";
import { RequireAdmin } from "../../../components/RequireAuth";
import { Select } from "../../../components/Select";
import { Button } from "../../../components/Button";
import { useAuth } from "../../../lib/auth";
import { getErrorMessage } from "../../../lib/api";
import { formatMoney } from "../../../lib/money";

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELED";

type OrderRow = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: string;
  user: { id: string; email: string; name: string } | null;
  shipping: unknown;
};

export default function AdminOrdersPage() {
  return (
    <RequireAdmin>
      <AdminOrdersInner />
    </RequireAdmin>
  );
}

function AdminOrdersInner() {
  const { authedFetch } = useAuth();
  const [items, setItems] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = status ? `?status=${status}` : "";
      const data = await authedFetch<{ items: OrderRow[] }>(`/api/admin/orders${qs}`);
      setItems(data.items);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  }, [authedFetch, status]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  return (
    <AdminShell title="Orders">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
          <Select
            label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value === "" ? "" : (e.target.value as OrderStatus))}
          >
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELED">CANCELED</option>
          </Select>
          <div className="md:col-span-2 flex items-end justify-end">
            <Button variant="secondary" onClick={() => load()}>
              Refresh
            </Button>
          </div>
        </div>
        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div className="text-sm font-semibold">All orders</div>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-zinc-600 dark:text-zinc-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-5 text-sm text-zinc-700 dark:text-zinc-300">No orders.</div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((o) => (
              <OrderItemRow key={o.id} item={o} onChanged={load} />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function OrderItemRow({ item, onChanged }: { item: OrderRow; onChanged: () => Promise<void> }) {
  const { authedFetch } = useAuth();
  const [status, setStatus] = useState<OrderStatus>(item.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guestEmail =
    typeof item.shipping === "object" && item.shipping !== null
      ? (item.shipping as { email?: unknown }).email
      : undefined;

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{item.id}</div>
          <div className="mt-1 text-sm text-zinc-600">
            {(item.user?.email ??
              (typeof guestEmail === "string" && guestEmail ? guestEmail : "Guest"))}{" "}
            · {new Date(item.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="text-sm font-semibold">{formatMoney(item.totalCents, item.currency)}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-950 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:[color-scheme:dark]"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          disabled={busy}
        >
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELED">CANCELED</option>
        </select>
        <Button
          disabled={busy || status === item.status}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await authedFetch(`/api/admin/orders/${item.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
              });
              await onChanged();
            } catch (e: unknown) {
              setError(getErrorMessage(e, "Update failed"));
            } finally {
              setBusy(false);
            }
          }}
        >
          Update status
        </Button>
        <Link href={`/admin/orders/${item.id}`}>
          <Button variant="secondary">View & Print</Button>
        </Link>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>
    </div>
  );
}
