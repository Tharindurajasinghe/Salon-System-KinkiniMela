"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import PageHeader from "@/components/site/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageProvider";
import { useLazyReveal } from "@/lib/hooks/useLazyReveal";
import { api } from "@/lib/utils/apiClient";

export default function GalleryPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { url, name }
  useEffect(() => { api.get("/api/public/gallery").then(setRows).catch(() => setRows([])); }, []);

  // Close the lightbox on Escape + lock background scroll while open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [lightbox]);

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
                  <button
                    type="button"
                    onClick={() => photo.image?.url && setLightbox({ url: photo.image.url, name: photo.name })}
                    className="group relative block aspect-[3/4] w-full cursor-zoom-in bg-gray-50"
                    aria-label={photo.name || "View image"}
                  >
                    {photo.image?.url && <Image src={photo.image.url} alt={photo.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="300px" />}
                  </button>
                  {photo.name && <figcaption className="px-3 py-2 text-sm text-gray-600">{photo.name}</figcaption>}
                </figure>
              ))}
            </div>
            {hasMore && <div ref={sentinelRef} className="grid place-items-center py-8 text-brand-300"><Spinner /></div>}
          </>
        )}
      </div>

      {/* Full-screen lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt={lightbox.name || ""}
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.name && (
            <p className="mt-3 text-sm text-white/80" onClick={(e) => e.stopPropagation()}>{lightbox.name}</p>
          )}
        </div>
      )}
    </div>
  );
}