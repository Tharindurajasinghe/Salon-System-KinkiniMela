"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, Clock, X } from "lucide-react";
import PageHeader from "@/components/site/PageHeader";
import ServiceCard from "@/components/site/ServiceCard";
import CategoryFilter from "@/components/site/CategoryFilter";
import BookingModal from "@/components/site/BookingModal";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageProvider";
import { useLazyReveal } from "@/lib/hooks/useLazyReveal";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";

export default function ServicesPage() {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rows, setRows] = useState(null);
  const [details, setDetails] = useState(null); // service to view
  const [booking, setBooking] = useState(null); // service to "book"
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let active = true;
    setRows(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    api.get(`/api/public/services?${params}`).then((d) => active && setRows(d)).catch(() => active && setRows([]));
    return () => { active = false; };
  }, [q, categoryId]);

  const list = useMemo(() => rows || [], [rows]);
  const { visible, sentinelRef, hasMore } = useLazyReveal(list, 12);

  const pct = details?.discount?.percentage || 0;
  const detailsFinal = details ? (pct ? details.sellingPrice * (1 - pct / 100) : details.sellingPrice) : 0;

  return (
    <div>
      <PageHeader title={t("services.title")} subtitle={t("services.subtitle")} />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="relative mb-5 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("services.searchPlaceholder")}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <CategoryFilter type="service" value={categoryId} onChange={setCategoryId} />

        {rows === null ? (
          <div className="grid place-items-center py-20 text-brand-400"><Spinner className="h-7 w-7" /></div>
        ) : list.length === 0 ? (
          <p className="py-20 text-center text-gray-400">{t("common.empty")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((s) => <ServiceCard key={s._id} service={s} onView={setDetails} onBook={setBooking} />)}
            </div>
            {hasMore && <div ref={sentinelRef} className="grid place-items-center py-8 text-brand-300"><Spinner /></div>}
          </>
        )}
      </div>

      {/* Details modal */}
      <Modal open={!!details} onClose={() => setDetails(null)} title={details?.name} size="lg">
        {details && (
          <div>
            {details.image?.url && (
              <button
                onClick={() => setLightbox(details.image.url)}
                className="relative mb-4 block aspect-[16/9] w-full cursor-zoom-in overflow-hidden rounded-xl bg-gray-50"
              >
                <Image src={details.image.url} alt={details.name} fill className="object-cover transition-transform hover:scale-105" sizes="600px" />
              </button>
            )}

            {details.category?.name && <p className="text-[11px] uppercase tracking-wide text-gray-400">{details.category.name}</p>}

            <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">{t("common.startingFrom")}</p>
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

      {/* Full-screen image */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close"><X className="h-5 w-5" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <BookingModal open={!!booking} item={booking} itemType="service" onClose={() => setBooking(null)} />
    </div>
  );
}
