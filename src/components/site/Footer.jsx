"use client";

import Link from "next/link";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { useSalon } from "@/context/SalonProvider";

/** Customer-site footer. Shows salon identity + contact from Settings. */
export default function Footer() {
  const { t } = useLanguage();
  const salon = useSalon();

  const links = [
    { href: "/products", key: "nav.products" },
    { href: "/services", key: "nav.services" },
    { href: "/packages", key: "nav.packages" },
    { href: "/gallery", key: "nav.gallery" },
    { href: "/bookings", key: "nav.bookings" },
    { href: "/contact", key: "nav.contact" },
  ];

  return (
    <footer className="mt-20 border-t border-brand-100/60 bg-brand-900 text-brand-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-display text-2xl">{salon?.salonName || "Salon"}</p>
          {salon?.tagline && <p className="mt-2 max-w-xs text-sm text-brand-200">{salon.tagline}</p>}
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-200">{t("footer.quickLinks")}</p>
          <ul className="space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-brand-100 hover:text-white">{t(l.key)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-200">{t("footer.contact")}</p>
          <ul className="space-y-2 text-sm text-brand-100">
            {salon?.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {salon.phone}</li>}
            {salon?.whatsapp && <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> {salon.whatsapp}</li>}
            {salon?.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {salon.email}</li>}
            {(salon?.addressLine1 || salon?.addressLine2) && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{salon.addressLine1}{salon.addressLine2 ? `, ${salon.addressLine2}` : ""}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-brand-300">
        © {new Date().getFullYear()} {salon?.salonName || "Salon"}. {t("footer.rights")} · TAR Solutions
      </div>
    </footer>
  );
}
