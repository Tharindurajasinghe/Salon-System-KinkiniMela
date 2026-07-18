"use client";

import { LanguageProvider } from "@/context/LanguageProvider";
import { SalonProvider } from "@/context/SalonProvider";
import { CartProvider } from "@/context/CartProvider";
import AppFrame from "@/components/site/AppFrame";

/** Single client wrapper mounting all shared providers + conditional chrome. */
export default function Providers({ initialLang, children }) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <SalonProvider>
        <CartProvider>
          <AppFrame>{children}</AppFrame>
        </CartProvider>
      </SalonProvider>
    </LanguageProvider>
  );
}
