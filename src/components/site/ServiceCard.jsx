"use client";

import Image from "next/image";
import { Clock, ImageIcon, CalendarPlus, Eye } from "lucide-react";
import DiscountBadge from "./DiscountBadge";
import { useLanguage } from "@/context/LanguageProvider";
import { formatRs } from "@/lib/utils/currency";

/** Service card. "Book now" is handled by the parent (opens BookNotice for now). */
export default function ServiceCard({ service, onView, onBook }) {
  const { t } = useLanguage();
  const pct = service.discount?.percentage || 0;
  const finalPrice = pct ? service.sellingPrice * (1 - pct / 100) : service.sellingPrice;

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-gray-50">
        <DiscountBadge discount={service.discount} />
        {service.image?.url ? (
          <Image src={service.image.url} alt={service.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="360px" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-gray-200"><ImageIcon className="h-9 w-9" /></span>
        )}
      </div>
      <div className="p-4">
        {service.category?.name && <p className="text-xs uppercase tracking-wide text-gray-400">{service.category.name}</p>}
        <p className="line-clamp-1 font-medium text-gray-900">{service.name}</p>
        {service.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{service.description}</p>}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-green-600">{t("common.startingFrom")}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-brand-600">{formatRs(finalPrice, 0)}</span>
              {pct > 0 && <span className="text-xs text-gray-400 line-through">{formatRs(service.sellingPrice, 0)}</span>}
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="h-3.5 w-3.5" /> {service.timeSpendMin} {t("common.minutes")}</span>
        </div>
        {service.consultationNeeded && (
          <p className="mt-2 text-xs font-medium text-red-500">{t("common.consultationNote")}</p>
        )}
        <div className="mt-3 flex gap-2">
          <button onClick={() => onView(service)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            <Eye className="h-4 w-4" /> {t("common.viewDetails")}
          </button>
          <button onClick={() => onBook(service)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-500 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50">
            <CalendarPlus className="h-4 w-4" /> {t("common.bookNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
