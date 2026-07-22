"use client";

import { useEffect } from "react";

/**
 * Mounted once globally. Stops the browser from changing a focused
 * number input's value when the mouse wheel scrolls over it — the
 * input just blurs and the page scrolls normally instead.
 */
export default function NumberInputGuard() {
  useEffect(() => {
    const onWheel = (e) => {
      const el = document.activeElement;
      if (el && el.tagName === "INPUT" && el.type === "number" && el === e.target) {
        el.blur();
      }
    };
    document.addEventListener("wheel", onWheel, { passive: true });
    return () => document.removeEventListener("wheel", onWheel);
  }, []);
  return null;
}