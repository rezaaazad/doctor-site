"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
  title: string;
  variantTitle: string;
  slug: string;
  image: string;
  price: number;
  compareAt: number;
  type: string;
  max: number;
};

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  savings: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (line: Omit<CartLine, "quantity"> & { quantity?: number }, opts?: { silent?: boolean }) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
  lastAdded: CartLine | null;
};

const KEY = "ds_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

function read(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.productId === "string").slice(0, 50) : [];
  } catch {
    return [];
  }
}

const same = (a: { productId: string; variantId: string | null }, productId: string, variantId: string | null) =>
  a.productId === productId && (a.variantId ?? null) === (variantId ?? null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartLine | null>(null);

  useEffect(() => {
    setLines(read());
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) setLines(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const add = useCallback<CartContextValue["add"]>(
    (line, opts) => {
      const quantity = Math.max(1, line.quantity ?? 1);
      const current = read();
      const existing = current.find((l) => same(l, line.productId, line.variantId));
      const max = Math.max(1, line.max || 99);
      const next = existing
        ? current.map((l) => (same(l, line.productId, line.variantId) ? { ...l, ...line, quantity: Math.min(max, l.quantity + quantity) } : l))
        : [...current, { ...line, quantity: Math.min(max, quantity) }];
      commit(next);
      setLastAdded({ ...line, quantity });
      if (!opts?.silent) setOpen(true);
    },
    [commit],
  );

  const setQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      const current = read();
      commit(
        quantity <= 0
          ? current.filter((l) => !same(l, productId, variantId))
          : current.map((l) => (same(l, productId, variantId) ? { ...l, quantity: Math.min(Math.max(1, l.max || 99), quantity) } : l)),
      );
    },
    [commit],
  );

  const remove = useCallback((productId: string, variantId: string | null) => commit(read().filter((l) => !same(l, productId, variantId))), [commit]);
  const clear = useCallback(() => commit([]), [commit]);
  const replace = useCallback((next: CartLine[]) => commit(next), [commit]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const savings = lines.reduce((sum, l) => sum + (l.compareAt > l.price ? (l.compareAt - l.price) * l.quantity : 0), 0);
    return { lines, ready, count, subtotal, savings, open, setOpen, add, setQuantity, remove, clear, replace, lastAdded };
  }, [lines, ready, open, add, setQuantity, remove, clear, replace, lastAdded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
