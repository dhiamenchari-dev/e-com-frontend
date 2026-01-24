"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "../../../components/AdminShell";
import { RequireAdmin } from "../../../components/RequireAuth";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { useAuth } from "../../../lib/auth";
import { getErrorMessage } from "../../../lib/api";
import type { Category } from "../../../lib/types";

export default function AdminCategoriesPage() {
  return (
    <RequireAdmin>
      <AdminCategoriesInner />
    </RequireAdmin>
  );
}

function AdminCategoriesInner() {
  const { authedFetch } = useAuth();
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await authedFetch<{ items: Category[] }>("/api/categories");
    setItems(data.items);
  }, [authedFetch]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load().catch((e: unknown) => setError(getErrorMessage(e, "Failed to load categories")));
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const sorted = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);

  return (
    <AdminShell title="Categories">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-semibold">Create category</div>
        <form
          className="mt-3 flex flex-col gap-3 md:flex-row md:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await authedFetch("/api/admin/categories", {
                method: "POST",
                body: JSON.stringify({ name }),
              });
              setName("");
              await load();
            } catch (err: unknown) {
              setError(getErrorMessage(err, "Failed to create category"));
            }
          }}
        >
          <div className="flex-1">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button type="submit">Create</Button>
        </form>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div className="text-sm font-semibold">All categories</div>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {sorted.map((c) => (
            <CategoryRow key={c.id} item={c} onChanged={load} />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

function CategoryRow({ item, onChanged }: { item: Category; onChanged: () => Promise<void> }) {
  const { authedFetch } = useAuth();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(item.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
      <div className="flex-1">
        {edit ? (
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        ) : (
          <div className="text-sm font-medium">{item.name}</div>
        )}
        {error ? <div className="mt-1 text-sm text-red-600">{error}</div> : null}
      </div>
      <div className="flex items-center gap-2">
        {edit ? (
          <>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  await authedFetch(`/api/admin/categories/${item.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ name }),
                  });
                  setEdit(false);
                  await onChanged();
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Update failed"));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEdit(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setEdit(true)}>
              Edit
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  await authedFetch(`/api/admin/categories/${item.id}`, { method: "DELETE" });
                  await onChanged();
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Delete failed"));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
