"use client";

import Link from "next/link";
import { useI18n } from "../lib/i18n";

export function Pagination({
  page,
  totalPages,
  basePath,
  query,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query: Record<string, string | undefined>;
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;
  const mkHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v) params.set(k, v);
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-2 sm:flex-row">
      <Link
        className={`rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 ${canPrev ? "hover:bg-zinc-50 hover:border-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-zinc-700" : "pointer-events-none opacity-50"}`}
        href={mkHref(Math.max(1, page - 1))}
      >
        ← {t("pagination.prev")}
      </Link>
      <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        {t("pagination.pageOf", { page, totalPages })}
      </div>
      <Link
        className={`rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 ${canNext ? "hover:bg-zinc-50 hover:border-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-zinc-700" : "pointer-events-none opacity-50"}`}
        href={mkHref(Math.min(totalPages, page + 1))}
      >
        {t("pagination.next")} →
      </Link>
    </div>
  );
}
