"use client";

import Link from "next/link";
import { Container } from "./Container";

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="py-10">
      <Container>
        <div className="mb-6">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Admin</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <aside className="md:col-span-1 print:hidden">
            <div className="ui-panel rounded-xl p-4">
              <nav className="flex gap-2 overflow-x-auto text-sm md:flex-col md:overflow-visible">
                <Link className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/admin">
                  Dashboard
                </Link>
                <Link className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/admin/products">
                  Products
                </Link>
                <Link className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/admin/categories">
                  Categories
                </Link>
                <Link className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/admin/orders">
                  Orders
                </Link>
                <Link className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/admin/users">
                  Users
                </Link>
                <Link className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5" href="/admin/settings">
                  Settings
                </Link>
              </nav>
            </div>
          </aside>
          <section className="md:col-span-3">{children}</section>
        </div>
      </Container>
    </main>
  );
}
