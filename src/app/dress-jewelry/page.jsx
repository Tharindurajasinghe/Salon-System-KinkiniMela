"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, X, Gem, CalendarPlus } from "lucide-react";
import PageHeader from "@/components/site/PageHeader";
import DressCard from "@/components/site/DressCard";
import DressBookingModal from "@/components/site/DressBookingModal";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageProvider";
import { useLazyReveal } from "@/lib/hooks/useLazyReveal";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";

export default function DressJewelryPage() {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(null);
  const [details, setDetails] = useState(null);
  const [booking, setBooking] = useState(null);
  const [lightbox, setLightbox] = useState(null);

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
              {visible.map((it) => <DressCard key={it._id} item={it} onView={setDetails} onBook={setBooking} />)}
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
                  <button key={i} onClick={() => setLightbox(img.url)} className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-gray-50">
                    <Image src={img.url} alt="" fill className="object-cover transition-transform hover:scale-105" sizes="200px" />
                  </button>
                ))}
              </div>
            )}

            {details.category?.name && <p className="text-[11px] uppercase tracking-wide text-gray-400">{details.category.name}</p>}
            {details.isDress && <span className="mt-1 inline-block rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-medium text-white">Dress</span>}
            {details.description && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">{details.description}</p>}

            {/* Variants */}
            <div className="mt-4 space-y-1.5">
              {details.variants.map((v) => (
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

            <button
              onClick={() => { setBooking(details); setDetails(null); }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              <CalendarPlus className="h-4 w-4" /> {t("common.bookNow")}
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

      <DressBookingModal open={!!booking} item={booking} onClose={() => setBooking(null)} />
    </div>
  );
}
