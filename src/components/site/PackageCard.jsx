"use client";

import Image from "next/image";
import { ImageIcon, Eye, CalendarPlus } from "lucide-react";
import DiscountBadge from "./DiscountBadge";
import { useLanguage } from "@/context/LanguageProvider";
import { formatRs } from "@/lib/utils/currency";

/** Package card with view-details and book-now actions (handled by parent). */
export default function PackageCard({ pkg, onView, onBook }) {
  const { t } = useLanguage();
  const pct = pkg.discount?.percentage || 0;
  const finalPrice = pct ? pkg.price * (1 - pct / 100) : pkg.price;
  const cover = pkg.images?.[0];

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-gray-50">
        <DiscountBadge discount={pkg.discount} />
        {cover?.url ? (
          <Image src={cover.url} alt={pkg.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="360px" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-gray-200"><ImageIcon className="h-9 w-9" /></span>
        )}
      </div>
      <div className="p-4">
        <p className="line-clamp-1 font-display text-lg text-gray-900">{pkg.name}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-brand-600">{formatRs(finalPrice, 0)}</span>
          {pct > 0 && <span className="text-xs text-gray-400 line-through">{formatRs(pkg.price, 0)}</span>}
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => onView(pkg)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Eye className="h-4 w-4" /> {t("common.viewDetails")}
          </button>
          <button onClick={() => onBook(pkg)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600">
            <CalendarPlus className="h-4 w-4" /> {t("common.bookNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
