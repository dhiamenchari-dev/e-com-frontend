"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "./types";
import { useAuth } from "./auth";
import { apiFetch } from "./api";
import { getFromStorage, removeFromStorage, setToStorage } from "./clientStorage";
import { getProductPrice } from "./product";

export type CartItem = {
  id: string;
  quantity: number;
  product: Pick<
    Product,
    "id" | "name" | "slug" | "priceCents" | "stock" | "images" | "discountValue" | "discountType"
  > & { isActive: boolean };
};

export type Cart = {
  id: string;
  items: CartItem[];
};

type CartContextValue = {
  cart: Cart | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  itemsCount: number;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_CART_KEY = "guestCartV1";

type GuestCartData = { items: { productId: string; quantity: number }[] };

function readGuestCart(): GuestCartData {
  const raw = getFromStorage(GUEST_CART_KEY);
  if (!raw) return { items: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return { items: [] };
    const items = (parsed as { items?: unknown }).items;
    if (!Array.isArray(items)) return { items: [] };
    const normalized = items
      .map((i) => {
        const obj = i as { productId?: unknown; quantity?: unknown };
        if (typeof obj.productId !== "string" || !obj.productId) return null;
        const q = Number(obj.quantity);
        if (!Number.isFinite(q)) return null;
        const quantity = Math.max(1, Math.min(99, Math.trunc(q)));
        return { productId: obj.productId, quantity };
      })
      .filter((x): x is { productId: string; quantity: number } => x !== null);
    return { items: normalized };
  } catch {
    return { items: [] };
  }
}

function writeGuestCart(next: GuestCartData): void {
  setToStorage(GUEST_CART_KEY, JSON.stringify(next));
}

function clearGuestCart(): void {
  removeFromStorage(GUEST_CART_KEY);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, authedFetch, isReady } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const data = await authedFetch<{ cart: Cart }>("/api/cart");
        setCart(data.cart);
        return;
      }

      const guest = readGuestCart();
      if (guest.items.length === 0) {
        setCart({ id: "guest", items: [] });
        return;
      }

      const ids = guest.items.map((i) => i.productId);
      const data = await apiFetch<{ items: CartItem["product"][] }>("/api/products/by-ids", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      const byId = new Map(data.items.map((p) => [p.id, p]));
      const items = guest.items
        .map((i) => {
          const product = byId.get(i.productId);
          if (!product) return null;
          return { id: i.productId, quantity: i.quantity, product };
        })
        .filter((x): x is CartItem => x !== null);
      setCart({ id: "guest", items });
    } finally {
      setIsLoading(false);
    }
  }, [authedFetch, user]);

  useEffect(() => {
    if (!isReady) return;
    refresh().catch(() => {});
  }, [isReady, refresh]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (user) {
        await authedFetch("/api/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId, quantity }),
        });
        await refresh();
        return;
      }

      const guest = readGuestCart();
      const idx = guest.items.findIndex((i) => i.productId === productId);
      const q = Math.max(1, Math.min(99, Math.trunc(Number(quantity))));
      if (idx >= 0) {
        guest.items[idx] = {
          productId,
          quantity: Math.max(1, Math.min(99, guest.items[idx]!.quantity + q)),
        };
      } else {
        guest.items.unshift({ productId, quantity: q });
      }
      writeGuestCart(guest);
      await refresh();
    },
    [authedFetch, refresh, user]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (user) {
        await authedFetch(`/api/cart/items/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        });
        await refresh();
        return;
      }

      const q = Math.max(1, Math.min(99, Math.trunc(Number(quantity))));
      const guest = readGuestCart();
      const idx = guest.items.findIndex((i) => i.productId === itemId);
      if (idx >= 0) {
        guest.items[idx] = { productId: itemId, quantity: q };
        writeGuestCart(guest);
      }
      await refresh();
    },
    [authedFetch, refresh, user]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (user) {
        await authedFetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
        await refresh();
        return;
      }

      const guest = readGuestCart();
      const next = { items: guest.items.filter((i) => i.productId !== itemId) };
      if (next.items.length === 0) clearGuestCart();
      else writeGuestCart(next);
      await refresh();
    },
    [authedFetch, refresh, user]
  );

  const clear = useCallback(async () => {
    if (user) {
      await authedFetch("/api/cart/clear", { method: "DELETE" });
      await refresh();
      return;
    }
    clearGuestCart();
    await refresh();
  }, [authedFetch, refresh, user]);

  const itemsCount = useMemo(
    () => (cart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0),
    [cart]
  );

  const subtotalCents = useMemo(
    () =>
      (cart?.items ?? []).reduce((sum, i) => sum + getProductPrice(i.product).price * i.quantity, 0),
    [cart]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      refresh,
      addItem,
      updateItemQuantity,
      removeItem,
      clear,
      itemsCount,
      subtotalCents,
    }),
    [
      addItem,
      cart,
      clear,
      isLoading,
      itemsCount,
      refresh,
      removeItem,
      subtotalCents,
      updateItemQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("CartProvider missing");
  return ctx;
}
