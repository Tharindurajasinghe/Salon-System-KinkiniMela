"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

/**
 * Fills its (relative, sized) parent with an image. When more than one image is
 * given, it auto cross-fades between them on a timer — used by product/package
 * and dress cards. Pass a `fallbackIcon` for the empty state.
 */
export default function CardImages({ images = [], alt = "", interval = 3000, sizes = "360px", fallbackIcon }) {
  const valid = (images || []).filter((im) => im?.url);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    if (valid.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % valid.length), interval);
    return () => clearInterval(id);
  }, [valid.length, interval]);

  if (valid.length === 0) {
    return (
      <span className="absolute inset-0 grid place-items-center text-gray-200">
        {fallbackIcon || <ImageIcon className="h-9 w-9" />}
      </span>
    );
  }

  return (
    <>
      {valid.map((im, i) => (
        <Image
          key={im.url}
          src={im.url}
          alt={alt}
          fill
          sizes={sizes}
          className={
            "object-cover transition duration-700 group-hover:scale-105 " +
            (i === idx ? "opacity-100" : "opacity-0")
          }
        />
      ))}
      {valid.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {valid.map((_, i) => (
            <span
              key={i}
              className={"h-1.5 rounded-full transition-all " + (i === idx ? "w-3 bg-white" : "w-1.5 bg-white/60")}
            />
          ))}
        </div>
      )}
    </>
  );
}
