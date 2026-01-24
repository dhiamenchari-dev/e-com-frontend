"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/AdminShell";
import { RequireAdmin } from "../../../components/RequireAuth";
import { Button } from "../../../components/Button";
import { useAuth } from "../../../lib/auth";
import { getErrorMessage } from "../../../lib/api";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  isBlocked: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  return (
    <RequireAdmin>
      <AdminUsersInner />
    </RequireAdmin>
  );
}

function AdminUsersInner() {
  const { authedFetch } = useAuth();
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authedFetch<{ items: UserRow[] }>("/api/admin/users?page=1&limit=50");
      setItems(data.items);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load users"));
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
    <AdminShell title="Users">
      {error ? <div className="mb-4 text-sm text-red-600">{error}</div> : null}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div className="text-sm font-semibold">All users</div>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-zinc-600 dark:text-zinc-400">Loading…</div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((u) => (
              <UserRowItem key={u.id} item={u} onChanged={load} />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function UserRowItem({ item, onChanged }: { item: UserRow; onChanged: () => Promise<void> }) {
  const { authedFetch } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">
            {item.name}{" "}
            <span className="ml-2 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {item.role}
            </span>
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.email}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={item.isBlocked ? "secondary" : "danger"}
            disabled={busy || item.role === "ADMIN"}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await authedFetch(`/api/admin/users/${item.id}/block`, {
                  method: "PATCH",
                  body: JSON.stringify({ blocked: !item.isBlocked }),
                });
                await onChanged();
              } catch (e: unknown) {
                setError(getErrorMessage(e, "Update failed"));
              } finally {
                setBusy(false);
              }
            }}
          >
            {item.isBlocked ? "Unblock" : "Block"}
          </Button>
        </div>
      </div>
      {item.role === "ADMIN" ? (
        <div className="mt-2 text-xs text-zinc-500">Admin accounts cannot be blocked here.</div>
      ) : null}
      {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
    </div>
  );
}
