"use client";

import { Phone, MessageCircle, Mail, MapPin, ExternalLink } from "lucide-react";
import PageHeader from "@/components/site/PageHeader";
import { useLanguage } from "@/context/LanguageProvider";
import { useSalon } from "@/context/SalonProvider";

export default function ContactPage() {
  const { t, lang } = useLanguage();
  const salon = useSalon();
  const message = salon?.contactMessage?.[lang] || salon?.contactMessage?.en || "";
  const address = [salon?.addressLine1, salon?.addressLine2].filter(Boolean).join(", ");

  const rows = [
    salon?.phone && { Icon: Phone, label: t("contact.phone"), value: salon.phone, href: `tel:${salon.phone}` },
    salon?.whatsapp && { Icon: MessageCircle, label: t("contact.whatsapp"), value: salon.whatsapp, href: `https://wa.me/${salon.whatsapp.replace(/[^0-9]/g, "")}` },
    salon?.email && { Icon: Mail, label: t("contact.email"), value: salon.email, href: `mailto:${salon.email}` },
    address && { Icon: MapPin, label: t("contact.address"), value: address },
  ].filter(Boolean);

  return (
    <div>
      <PageHeader title={t("contact.title")} subtitle={t("contact.subtitle")} />
      <div className="mx-auto max-w-3xl px-6 py-8">
        {message && (
          <div className="mb-8 rounded-2xl bg-brand-50 p-6 text-center text-gray-700">
            <p className="whitespace-pre-line">{message}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((r, i) => {
            const Inner = (
              <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><r.Icon className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-400">{r.label}</p>
                  <p className="truncate font-medium text-gray-900">{r.value}</p>
                </div>
              </div>
            );
            return r.href ? <a key={i} href={r.href} target="_blank" rel="noreferrer">{Inner}</a> : <div key={i}>{Inner}</div>;
          })}
        </div>

        {salon?.locationUrl && (
          <a href={salon.locationUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            <MapPin className="h-4 w-4" /> {t("contact.location")} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
