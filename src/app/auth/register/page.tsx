"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import { Button } from "../../../components/Button";
import { Container } from "../../../components/Container";
import { Input } from "../../../components/Input";
import { useAuth } from "../../../lib/auth";
import { getErrorMessage } from "../../../lib/api";
import { useI18n } from "../../../lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let next = "/";
    try {
      next = new URL(window.location.href).searchParams.get("next") ?? next;
    } catch {}
    router.replace(next);
  }, [router, user]);

  return (
    <main className="py-12">
      <Container>
        <div className="mx-auto max-w-md rounded-3xl border border-zinc-200/70 bg-white/80 dark:bg-zinc-900/80 dark:border-zinc-800/70 p-6 shadow-sm backdrop-blur">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{t("auth.registerTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t("auth.registerSubtitle")}</p>

          <form
            className="mt-6 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              try {
                await register({ name, email, password });
                let next = "/";
                try {
                  next = new URL(window.location.href).searchParams.get("next") ?? next;
                } catch {}
                router.push(next);
              } catch (err: unknown) {
                setError(getErrorMessage(err, "Registration failed"));
              } finally {
                setLoading(false);
              }
            }}
          >
            <Input label={t("auth.name")} value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input
              label={t("auth.password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? t("auth.creating") : t("nav.register")}
            </Button>
          </form>

          <div className="mt-5 text-sm text-zinc-600 dark:text-zinc-300">
            {t("auth.haveAccount")}{" "}
            <Link href="/auth/login" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
              {t("nav.login")}
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
