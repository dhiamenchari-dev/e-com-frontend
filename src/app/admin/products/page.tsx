"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/AdminShell";
import { RequireAdmin } from "../../../components/RequireAuth";
import { Button } from "../../../components/Button";
import { useAuth } from "../../../lib/auth";
import { getErrorMessage } from "../../../lib/api";
import { formatMoney } from "../../../lib/money";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  stock: number;
  isActive: boolean;
  category: { id: string; name: string };
  createdAt: string;
};

export default function AdminProductsPage() {
  return (
    <RequireAdmin>
      <AdminProductsInner />
    </RequireAdmin>
  );
}

function AdminProductsInner() {
  const { authedFetch } = useAuth();
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authedFetch<{ items: ProductRow[] }>("/api/admin/products?page=1&limit=50");
      setItems(data.items);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load products"));
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  return (
    <AdminShell title="Products">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/admin/products/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Create product</Button>
        </Link>
        <Button className="w-full sm:w-auto" variant="secondary" onClick={() => load()}>
          Refresh
        </Button>
      </div>

      {error ? <div className="mb-4 text-sm text-red-600">{error}</div> : null}

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-[color:var(--divider-subtle)] dark:bg-zinc-800">
        <div className="border-b border-zinc-200 p-5 dark:border-[color:var(--divider-subtle)]">
          <div className="text-sm font-semibold">All products</div>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-zinc-600 dark:text-zinc-400">Loading…</div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-[color:var(--divider-subtle)]">
            {items.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {p.category.name} · {formatMoney(p.priceCents)} · Stock {p.stock} ·{" "}
                    {p.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/products/${p.id}`}>
                    <Button variant="secondary">Edit</Button>
                  </Link>
                  {p.isActive ? (
                    <Button
                      variant="danger"
                      disabled={busyId === p.id}
                      onClick={async () => {
                        setError(null);
                        setBusyId(p.id);
                        try {
                          await authedFetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
                          await load();
                        } catch (e: unknown) {
                          setError(getErrorMessage(e, "Failed to delete product"));
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    >
                      {busyId === p.id ? "Deleting…" : "Delete"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
