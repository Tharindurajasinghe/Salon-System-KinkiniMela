"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import PageHeader from "@/components/site/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageProvider";
import { useLazyReveal } from "@/lib/hooks/useLazyReveal";
import { api } from "@/lib/utils/apiClient";

export default function GalleryPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get("/api/public/gallery").then(setRows).catch(() => setRows([])); }, []);

  const list = useMemo(() => rows || [], [rows]);
  const { visible, sentinelRef, hasMore } = useLazyReveal(list, 12);

  return (
    <div>
      <PageHeader title={t("gallery.title")} subtitle={t("gallery.subtitle")} />
      <div className="mx-auto max-w-7xl px-6 py-6">
        {rows === null ? (
          <div className="grid place-items-center py-20 text-brand-400"><Spinner className="h-7 w-7" /></div>
        ) : list.length === 0 ? (
          <p className="py-20 text-center text-gray-400">{t("common.empty")}</p>
        ) : (
          <>
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
              {visible.map((photo) => (
                <figure key={photo._id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="relative aspect-[3/4] bg-gray-50">
                    {photo.image?.url && <Image src={photo.image.url} alt={photo.name} fill className="object-cover transition-transform duration-500 hover:scale-105" sizes="300px" />}
                  </div>
                  {photo.name && <figcaption className="px-3 py-2 text-sm text-gray-600">{photo.name}</figcaption>}
                </figure>
              ))}
            </div>
            {hasMore && <div ref={sentinelRef} className="grid place-items-center py-8 text-brand-300"><Spinner /></div>}
          </>
        )}
      </div>
    </div>
  );
}
