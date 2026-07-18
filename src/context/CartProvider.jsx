"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Customer product cart (pre-orders). Persisted to localStorage so it survives
 * page reloads. NOTE: this is UI state only — the database of record is always
 * MongoDB; nothing business-critical is kept in the browser.
 */
const CartContext = createContext(null);
const KEY = "salon_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  // Hydrate once on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    }
  }, [items, ready]);

  function add(product) {
    setItems((c) => {
      const found = c.find((i) => i.refId === product.refId);
      if (found) return c.map((i) => (i.refId === product.refId ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { ...product, qty: 1 }];
    });
  }
  const setQty = (refId, qty) => setItems((c) => c.map((i) => (i.refId === refId ? { ...i, qty: Math.max(1, qty) } : i)));
  const remove = (refId) => setItems((c) => c.filter((i) => i.refId !== refId));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.sellingPrice * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
