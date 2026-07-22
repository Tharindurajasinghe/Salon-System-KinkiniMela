"use client";

import { CalendarPlus, Gem, Eye } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { formatRs } from "@/lib/utils/currency";
import CardImages from "./CardImages";

/** Dress/jewelry card — shows the item and its variants (name, price, stock). */
export default function DressCard({ item, onView, onBook }) {
  const { t } = useLanguage();

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-gray-50">
        <CardImages images={item.images} alt={item.name} fallbackIcon={<Gem className="h-9 w-9" />} />
        {item.isDress && <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-medium text-white">Dress</span>}
      </div>
      <div className="p-4">
        {item.category?.name && <p className="text-xs uppercase tracking-wide text-gray-400">{item.category.name}</p>}
        <p className="line-clamp-1 font-medium text-gray-900">{item.name}</p>
        {item.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description}</p>}

        {/* Variants */}
        <div className="mt-3 space-y-1.5">
          {item.variants.map((v) => (
            <div key={v._id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
              <span className="font-medium text-gray-700">{v.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-brand-600">{formatRs(v.sellingPrice, 0)}</span>
                <span className={"text-xs " + (v.stock > 0 ? "text-gray-400" : "text-red-400")}>
                  {v.stock > 0 ? `${v.stock} ${t("dress.available")}` : t("dress.outOfStock")}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={() => onView(item)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Eye className="h-4 w-4" /> {t("common.viewDetails")}
          </button>
          <button onClick={() => onBook(item)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600">
            <CalendarPlus className="h-4 w-4" /> {t("common.bookNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
