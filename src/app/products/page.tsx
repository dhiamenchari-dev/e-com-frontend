"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { Category, Product } from "../../lib/types";
import { Container } from "../../components/Container";
import { ProductCard } from "../../components/ProductCard";
import { Pagination } from "../../components/Pagination";
import { apiFetch, getErrorMessage } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { useSearchParams } from "next/navigation";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Button } from "../../components/Button";

type ProductsResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: Product[];
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="py-10 md:py-12">
          <Container>
            <div className="mb-6 space-y-2">
              <div className="h-7 w-40 animate-pulse rounded bg-zinc-200/60" />
              <div className="h-4 w-72 animate-pulse rounded bg-zinc-200/50" />
            </div>
            <div className="mb-8 grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm backdrop-blur md:grid-cols-6">
              <div className="col-span-2 h-16 animate-pulse rounded-xl bg-zinc-200/50 md:col-span-2" />
              <div className="col-span-2 h-16 animate-pulse rounded-xl bg-zinc-200/50 md:col-span-2" />
              <div className="h-16 animate-pulse rounded-xl bg-zinc-200/50" />
              <div className="h-16 animate-pulse rounded-xl bg-zinc-200/50" />
              <div className="col-span-2 h-11 animate-pulse rounded-xl bg-zinc-200/60 md:col-span-6" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[220px] animate-pulse rounded-2xl border border-zinc-200/70 bg-white/60"
                />
              ))}
            </div>
          </Container>
        </main>
      }
    >
      <ProductsInner />
    </Suspense>
  );
}

function ProductsInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();

  const page = searchParams.get("page") ?? "1";
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const minPrice = searchParams.get("minPrice") ?? undefined;
  const maxPrice = searchParams.get("maxPrice") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const [productsData, setProductsData] = useState<ProductsResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(
    () => [page, categoryId, minPrice, maxPrice, search].filter(Boolean).join("|"),
    [page, categoryId, minPrice, maxPrice, search]
  );

  useEffect(() => {
    const controller = new AbortController();
    const t = window.setTimeout(() => {
      const qs = new URLSearchParams();
      qs.set("page", page);
      qs.set("limit", "12");
      if (categoryId) qs.set("categoryId", categoryId);
      if (minPrice) qs.set("minPrice", minPrice);
      if (maxPrice) qs.set("maxPrice", maxPrice);
      if (search) qs.set("search", search);

      setLoading(true);
      setError(null);
      Promise.all([
        apiFetch<ProductsResponse>(`/api/products?${qs.toString()}`, { signal: controller.signal }),
        apiFetch<{ items: Category[] }>(`/api/categories`, { signal: controller.signal }),
      ])
        .then(([products, cats]) => {
          setProductsData(products);
          setCategories(cats.items);
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          setError(getErrorMessage(e, "Failed to load products"));
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          setLoading(false);
        });
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [categoryId, maxPrice, minPrice, page, search]);

  return (
    <main className="py-10 md:py-12">
      <Container>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{t("products.title")}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t("products.subtitle")}</p>
        </div>

        <form
          key={queryKey}
          className="mb-8 grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200/70 bg-white/80 dark:bg-zinc-900/80 dark:border-zinc-800/70 p-4 shadow-sm backdrop-blur md:grid-cols-6"
        >
          <div className="col-span-2 md:col-span-2">
            <Input
              label={t("products.searchLabel")}
              placeholder={t("products.searchPlaceholder")}
              name="search"
              defaultValue={search ?? ""}
            />
          </div>
          <div className="col-span-2 md:col-span-2">
            <Select label={t("products.categoryLabel")} name="categoryId" defaultValue={categoryId ?? ""}>
              <option value="">{t("products.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label={t("products.minPriceLabel")}
            placeholder={t("products.minPricePlaceholder")}
            name="minPrice"
            inputMode="decimal"
            defaultValue={minPrice ?? ""}
          />
          <Input
            label={t("products.maxPriceLabel")}
            placeholder={t("products.maxPricePlaceholder")}
            name="maxPrice"
            inputMode="decimal"
            defaultValue={maxPrice ?? ""}
          />
          <div className="col-span-2 md:col-span-6">
            <Button className="w-full">{t("products.applyFilters")}</Button>
          </div>
        </form>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        {loading && !productsData ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[220px] animate-pulse rounded-2xl border border-zinc-200/70 bg-white/60"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {(productsData?.items ?? []).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            <Pagination
              page={productsData?.page ?? 1}
              totalPages={productsData?.totalPages ?? 1}
              basePath="/products"
              query={{ categoryId, minPrice, maxPrice, search }}
            />
          </>
        )}
      </Container>
    </main>
  );
}
