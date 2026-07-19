"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, Clock } from "lucide-react";
import PageHeader from "@/components/site/PageHeader";
import PackageCard from "@/components/site/PackageCard";
import BookingModal from "@/components/site/BookingModal";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageProvider";
import { useLazyReveal } from "@/lib/hooks/useLazyReveal";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";

export default function PackagesPage() {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(null);
  const [details, setDetails] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    let active = true;
    setRows(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    api.get(`/api/public/packages?${params}`).then((d) => active && setRows(d)).catch(() => active && setRows([]));
    return () => { active = false; };
  }, [q]);

  const list = useMemo(() => rows || [], [rows]);
  const { visible, sentinelRef, hasMore } = useLazyReveal(list, 9);

  const pct = details?.discount?.percentage || 0;
  const detailsFinal = details ? (pct ? details.sellingPrice * (1 - pct / 100) : details.sellingPrice) : 0;

  return (
    <div>
      <PageHeader title={t("packages.title")} subtitle={t("packages.subtitle")} />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("packages.searchPlaceholder")}
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
              {visible.map((p) => <PackageCard key={p._id} pkg={p} onView={setDetails} onBook={setBooking} />)}
            </div>
            {hasMore && <div ref={sentinelRef} className="grid place-items-center py-8 text-brand-300"><Spinner /></div>}
          </>
        )}
      </div>

      {/* Details modal */}
      <Modal open={!!details} onClose={() => setDetails(null)} title={details?.name} size="lg">
        {details && (
          <div>
            {details.images?.length > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-2">
                {details.images.map((img, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-gray-50">
                    <Image src={img.url} alt="" fill className="object-cover" sizes="200px" />
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] uppercase tracking-wide text-gray-400">{t("common.startingFrom")}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-brand-600">{formatRs(detailsFinal, 0)}</span>
              {pct > 0 && <span className="text-sm text-gray-400 line-through">{formatRs(details.sellingPrice, 0)}</span>}
            </div>
            {details.consultationNeeded && (
              <p className="mt-2 text-sm font-medium text-red-500">{t("common.consultationNote")}</p>
            )}
            {details.timeSpendMin ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500"><Clock className="h-4 w-4" /> {details.timeSpendMin} {t("common.minutes")}</p>
            ) : null}
            {details.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">{details.description}</p>}
            {details.timeSlots?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">{t("common.time")}</p>
                <div className="flex flex-wrap gap-2">
                  {details.timeSlots.map((s) => <span key={s} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-600">{s}</span>)}
                </div>
              </div>
            )}
            <button
              onClick={() => { setBooking(details); setDetails(null); }}
              className="mt-6 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              {t("common.bookNow")}
            </button>
          </div>
        )}
      </Modal>

      <BookingModal open={!!booking} item={booking} itemType="package" onClose={() => setBooking(null)} />
    </div>
  );
}
