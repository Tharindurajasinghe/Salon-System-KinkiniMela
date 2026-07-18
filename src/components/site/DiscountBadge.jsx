"use client";

import { useLanguage } from "@/context/LanguageProvider";

/** Big discount label shown on a card when a percentage discount is set. */
export default function DiscountBadge({ discount }) {
  const { t } = useLanguage();
  if (!discount?.percentage) return null;
  return (
    <div className="absolute left-0 top-3 z-10 rounded-r-lg bg-gold-500 py-1 pl-3 pr-4 text-white shadow">
      <span className="text-base font-bold leading-none">{discount.percentage}% {t("common.off")}</span>
      {discount.note && <span className="mt-0.5 block text-[10px] leading-tight opacity-90">{discount.note}</span>}
    </div>
  );
}
