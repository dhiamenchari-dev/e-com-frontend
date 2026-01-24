"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "../../../../components/AdminShell";
import { RequireAdmin } from "../../../../components/RequireAuth";
import { Button } from "../../../../components/Button";
import { Input } from "../../../../components/Input";
import { Select } from "../../../../components/Select";
import { useAuth } from "../../../../lib/auth";
import { getErrorMessage } from "../../../../lib/api";
import type { Category, ProductImage } from "../../../../lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePriceInput(value: string): number {
  const normalized = value.replace(",", ".").trim();
  return Number.parseFloat(normalized);
}

function parseStockInput(value: string): number {
  const normalized = value.trim();
  return Number.parseInt(normalized, 10);
}

function getApiPayloadErrorMessage(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const error = payload.error;
  if (!isRecord(error)) return undefined;
  const message = error.message;
  return typeof message === "string" && message ? message : undefined;
}

function isProductImage(value: unknown): value is ProductImage {
  if (!isRecord(value)) return false;
  if (typeof value.url !== "string") return false;
  const pid = value.publicId;
  return pid === undefined || typeof pid === "string";
}

export default function AdminNewProductPage() {
  return (
    <RequireAdmin>
      <AdminNewProductInner />
    </RequireAdmin>
  );
}

function AdminNewProductInner() {
  const router = useRouter();
  const { authedFetch, accessToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [catsLoading, setCatsLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "0",
    categoryId: "",
    isActive: true,
    shippingCents: "",
    discountValue: "",
    discountType: "PERCENTAGE",
  });
  const [images, setImages] = useState<ProductImage[]>([]);

  useEffect(() => {
    setCatsLoading(true);
    authedFetch<{ items: Category[] }>("/api/categories")
      .then((d) => {
        setCategories(d.items);
        setForm((f) => {
          const first = d.items[0];
          if (f.categoryId || !first) return f;
          return { ...f, categoryId: first.id };
        });
      })
      .catch((e: unknown) => setError(getErrorMessage(e, "Failed to load categories")))
      .finally(() => setCatsLoading(false));
  }, [authedFetch]);

  const priceValue = useMemo(() => parsePriceInput(form.price), [form.price]);
  const stockValue = useMemo(() => parseStockInput(form.stock), [form.stock]);

  const disabledReasons = useMemo(() => {
    const reasons: string[] = [];
    if (form.name.trim().length < 2) reasons.push("Name is required (min 2 chars)");
    if (form.description.trim().length < 10) reasons.push("Description is required (min 10 chars)");
    if (!Number.isFinite(priceValue) || priceValue <= 0) reasons.push("Price must be > 0");
    if (!Number.isFinite(stockValue) || stockValue < 0) reasons.push("Stock must be 0 or more");
    if (categories.length === 0) reasons.push("Create a category first");
    else if (!form.categoryId) reasons.push("Select a category");
    return reasons;
  }, [categories.length, form.categoryId, form.description, form.name, priceValue, stockValue]);

  const canSubmit = useMemo(
    () =>
      form.name.trim().length >= 2 &&
      form.description.trim().length >= 10 &&
      Number.isFinite(priceValue) &&
      priceValue > 0 &&
      Number.isFinite(stockValue) &&
      stockValue >= 0 &&
      !!form.categoryId &&
      categories.length > 0,
    [categories.length, form, priceValue, stockValue]
  );

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${API_URL}/api/admin/uploads/product-image`, {
          method: "POST",
          body: fd,
          credentials: "include",
          headers: { authorization: `Bearer ${accessToken}` },
        });
        const json: unknown = await res.json().catch(() => null);
        if (!res.ok) throw new Error(getApiPayloadErrorMessage(json) ?? "Upload failed");
        const image = isRecord(json) ? json.image : undefined;
        if (!isProductImage(image)) throw new Error("Invalid upload response");
        
        // Ensure URL is absolute for local display
        const imageUrl = image.url.startsWith("http") 
          ? image.url 
          : new URL(image.url, window.location.origin).toString();
          
        setImages((prev) => [...prev, { ...image, url: imageUrl }]);
      }
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Upload failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell title="Create product">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSubmit) return;
            setBusy(true);
            setError(null);
            try {
              const created = await authedFetch<{ product: { id: string } }>("/api/admin/products", {
                method: "POST",
                body: JSON.stringify({
                  name: form.name.trim(),
                  slug: form.slug.trim() ? form.slug.trim() : undefined,
                  description: form.description.trim(),
                  price: priceValue,
                  stock: stockValue,
                  categoryId: form.categoryId,
                  images,
                  isActive: form.isActive,
                  shippingCents: form.shippingCents ? Math.round(Number(form.shippingCents) * 100) : null,
                  discountValue: form.discountValue ? Number(form.discountValue) : null,
                  discountType: form.discountValue ? form.discountType : null,
                }),
              });
              router.push(`/admin/products/${created.product.id}`);
            } catch (e: unknown) {
              setError(getErrorMessage(e, "Create failed"));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Slug (optional)"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="auto-generated from name"
          />
          <div className="md:col-span-2">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-300">Description</div>
              <textarea
                className="min-h-32 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700 dark:focus:ring-zinc-50/10"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
            </label>
          </div>
          <Input
            label="Price"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
          <Input
            label="Stock"
            inputMode="numeric"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            required
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:col-span-2">
            <Input
              label="Shipping Price (DT) - Optional"
              placeholder="Leave empty for default"
              inputMode="decimal"
              value={form.shippingCents}
              onChange={(e) => setForm((f) => ({ ...f, shippingCents: e.target.value }))}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Discount Value - Optional"
                  placeholder="0"
                  inputMode="decimal"
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                />
              </div>
              <div className="w-32">
                <Select
                  label="Type"
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">DT</option>
                </Select>
              </div>
            </div>
          </div>

          <Select
            label="Category"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            {categories.length === 0 ? <option value="">No categories</option> : null}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Active"
            value={String(form.isActive)}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>

          <div className="md:col-span-2">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Images</div>
            <div className="mt-2 flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-100 dark:hover:file:bg-zinc-700"
                onChange={(e) => uploadFiles(e.target.files)}
              />
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Uploads go to Cloudinary via the backend.</div>
              {images.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((img) => (
                    <div
                      key={img.url}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-[color:var(--divider-subtle)] dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="Preview" className="h-8 w-8 object-cover rounded" />
                      <span>{img.publicId ?? "external"}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-600 hover:underline"
                        onClick={() => setImages((prev) => prev.filter((p) => p.url !== img.url))}
                      >
                        remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {error ? <div className="md:col-span-2 text-sm text-red-600">{error}</div> : null}
          {!error && !busy && !canSubmit && !catsLoading ? (
            <div className="md:col-span-2 text-sm text-zinc-600 dark:text-zinc-400">
              {disabledReasons.length ? `Fill required fields: ${disabledReasons.join(" · ")}` : null}
              {categories.length === 0 ? (
                <div className="mt-2">
                  <Button variant="secondary" type="button" onClick={() => router.push("/admin/categories")}>
                    Go to Categories
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => router.push("/admin/products")}>
              Cancel
            </Button>
            <Button disabled={!canSubmit || busy} type="submit">
              {busy ? "Saving…" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
