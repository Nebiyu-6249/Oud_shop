"use client";

import { useSyncExternalStore } from "react";

// The cart lives in localStorage. It holds only variant ids and quantities;
// names and prices are looked up from the catalogue, and the server reprices
// everything at checkout.

export type CartLine = { variantId: string; qty: number };

const KEY = "asturlab.cart.v1";
const MAX_QTY = 10;
const EMPTY: CartLine[] = [];

let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(raw)
      ? raw.filter(
          (l): l is CartLine =>
            l && typeof l.variantId === "string" && Number.isInteger(l.qty) && l.qty > 0,
        )
      : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // storage full or blocked: the cart still works for this page view
  }
  for (const l of listeners) l();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const cart = {
  add(variantId: string, qty = 1) {
    const lines = read();
    const existing = lines.find((l) => l.variantId === variantId);
    write(
      existing
        ? lines.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
        : [...lines, { variantId, qty: Math.min(MAX_QTY, qty) }],
    );
  },
  setQty(variantId: string, qty: number) {
    if (qty <= 0) return cart.remove(variantId);
    write(read().map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)));
  },
  remove(variantId: string) {
    write(read().filter((l) => l.variantId !== variantId));
  },
  clear() {
    write(EMPTY);
  },
};

export const CART_MAX_QTY = MAX_QTY;
