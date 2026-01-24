import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950";
  const styles: Record<string, string> = {
    primary:
      "bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)] shadow hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5",
    secondary:
      "border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 hover:shadow hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:border-zinc-700",
    ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
