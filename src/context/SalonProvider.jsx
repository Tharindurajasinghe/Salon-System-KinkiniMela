"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Fetches public salon identity/contact once and shares it with the navbar,
 * footer, home and contact pages — so the whole site reads from Settings.
 */
const SalonContext = createContext(null);

export function SalonProvider({ children }) {
  const [salon, setSalon] = useState(null);
  useEffect(() => {
    fetch("/api/public/salon")
      .then((r) => r.json())
      .then((b) => b.success && setSalon(b.data))
      .catch(() => {});
  }, []);
  return <SalonContext.Provider value={salon}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  return useContext(SalonContext);
}
