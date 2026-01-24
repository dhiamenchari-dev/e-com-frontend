import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, className = "", ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-300">{label}</div> : null}
      <input
        className={`h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 placeholder:text-zinc-400 shadow-sm outline-none transition-all focus:border-[var(--brand-accent)] focus:ring-4 focus:ring-[var(--brand-accent)]/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 ${className}`}
        {...props}
      />
    </label>
  );
}
