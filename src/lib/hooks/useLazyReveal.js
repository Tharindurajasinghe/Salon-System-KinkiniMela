"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lazy list reveal: renders `step` items at a time and reveals more when a
 * sentinel scrolls into view (the spec's "load as you scroll" behaviour).
 * Returns the slice to render plus a ref to place on the sentinel element.
 *
 *   const { visible, sentinelRef, hasMore } = useLazyReveal(items, 12);
 */
export function useLazyReveal(items, step = 12) {
  const [count, setCount] = useState(step);
  const sentinelRef = useRef(null);

  // Reset when the underlying list changes (e.g. after a search).
  useEffect(() => { setCount(step); }, [items, step]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setCount((c) => Math.min(c + step, items.length));
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, step]);

  return { visible: items.slice(0, count), sentinelRef, hasMore: count < items.length };
}
