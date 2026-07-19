"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import PageHeader from "@/components/site/PageHeader";
import DressCard from "@/components/site/DressCard";
import DressBookingModal from "@/components/site/DressBookingModal";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageProvider";
import { useLazyReveal } from "@/lib/hooks/useLazyReveal";
import { api } from "@/lib/utils/apiClient";

export default function DressJewelryPage() {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    let active = true;
    setRows(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    api.get(`/api/public/dressjewelry?${params}`).then((d) => active && setRows(d)).catch(() => active && setRows([]));
    return () => { active = false; };
  }, [q]);

  const list = useMemo(() => rows || [], [rows]);
  const { visible, sentinelRef, hasMore } = useLazyReveal(list, 9);

  return (
    <div>
      <PageHeader title={t("dress.title")} subtitle={t("dress.subtitle")} />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("dress.searchPlaceholder")}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {rows === null ? (
          <div className="grid place-items-center py-20 text-brand-400"><Spinner className="h-7 w-7" /></div>
        ) : list.length === 0 ? (
          <p className="py-20 text-center text-gray-400">{t("common.empty")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((it) => <DressCard key={it._id} item={it} onBook={setBooking} />)}
            </div>
            {hasMore && <div ref={sentinelRef} className="grid place-items-center py-8 text-brand-300"><Spinner /></div>}
          </>
        )}
      </div>

      <DressBookingModal open={!!booking} item={booking} onClose={() => setBooking(null)} />
    </div>
  );
}
