"use client";

import { Eye, CalendarPlus } from "lucide-react";
import DiscountBadge from "./DiscountBadge";
import CardImages from "./CardImages";
import { useLanguage } from "@/context/LanguageProvider";
import { formatRs } from "@/lib/utils/currency";

/** Package card with view-details and book-now actions (handled by parent). */
export default function PackageCard({ pkg, onView, onBook }) {
  const { t } = useLanguage();
  const pct = pkg.discount?.percentage || 0;
  const finalPrice = pct ? pkg.sellingPrice * (1 - pct / 100) : pkg.sellingPrice;

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-gray-50">
        <DiscountBadge discount={pkg.discount} />
        <CardImages images={pkg.images} alt={pkg.name} />
      </div>
      <div className="p-4">
        <p className="line-clamp-1 font-display text-lg text-gray-900">{pkg.name}</p>
        <span className="text-[10px] uppercase tracking-wide text-green-600">{t("common.startingFrom")}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-brand-600">{formatRs(finalPrice, 0)}</span>
          {pct > 0 && <span className="text-xs text-grey-400 line-through">{formatRs(pkg.sellingPrice, 0)}</span>}
        </div>
        {pkg.consultationNeeded && (
          <p className="mt-2 text-xs font-medium text-red-500">{t("common.consultationNote")}</p>
        )}
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
