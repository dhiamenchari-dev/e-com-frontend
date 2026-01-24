"use client";

import { useI18n } from "../lib/i18n";

export function Spinner() {
  const { t } = useI18n();
  return (
    <div className="inline-flex items-center gap-2 text-sm text-zinc-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      {t("misc.loading")}
    </div>
  );
}
