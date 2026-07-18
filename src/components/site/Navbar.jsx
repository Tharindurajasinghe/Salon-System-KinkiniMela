"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "@/context/LanguageProvider";
import { useSalon } from "@/context/SalonProvider";
import { useCart } from "@/context/CartProvider";

const LINKS = [
  { href: "/", key: "nav.home" },
  { href: "/products", key: "nav.products" },
  { href: "/services", key: "nav.services" },
  { href: "/packages", key: "nav.packages" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/bookings", key: "nav.bookings" },
  { href: "/contact", key: "nav.contact" },
];

export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const salon = useSalon();
  const { count } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 transition-all",
        scrolled ? "border-b border-brand-100/60 bg-white/85 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          {salon?.logo?.url ? (
            <Image src={salon.logo.url} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-1 ring-brand-200" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-display text-brand-600">
              {salon?.salonName?.[0] || "S"}
            </span>
          )}
          <span className="font-display text-xl text-gray-900">{salon?.salonName || "Salon"}</span>
        </Link>

        {/* Desktop links */}
        <div className="ml-auto hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(l.href) ? "text-brand-600" : "text-gray-600 hover:text-brand-600"
              )}
            >
              {t(l.key)}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <LangToggle lang={lang} setLang={setLang} />

          <Link href="/cart" className="relative rounded-lg p-2 text-gray-700 hover:bg-brand-50 hover:text-brand-600">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>

          <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 text-gray-700 hover:bg-brand-50 lg:hidden" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-brand-100/60 bg-white lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive(l.href) ? "bg-brand-50 text-brand-600" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {t(l.key)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function LangToggle({ lang, setLang }) {
  return (
    <div className="flex items-center rounded-lg border border-gray-200 p-0.5 text-xs font-medium">
      {["en", "si"].map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={clsx(
            "rounded-md px-2 py-1 transition-colors",
            lang === code ? "bg-brand-500 text-white" : "text-gray-500 hover:text-gray-700"
          )}
        >
          {code === "en" ? "EN" : "සිං"}
        </button>
      ))}
    </div>
  );
}
