"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, X, ImageIcon } from "lucide-react";

/**
 * Uploads images to Cloudinary through /api/upload and returns {url, publicId}.
 * Single mode:  value = object|null,  onChange(object|null)
 * Multi mode:   value = array,        onChange(array), respects `max` (default 3)
 *
 * Reused by products, services, packages and gallery.
 */
export default function ImageUploader({ value, onChange, multiple = false, max = 3, folder = "salon" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const images = multiple ? value || [] : value ? [value] : [];
  const canAdd = multiple ? images.length < max : images.length === 0;

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const dataUrl = await toDataUrl(file);
        const res = await postUpload(dataUrl, folder);
        uploaded.push(res);
        if (!multiple) break;
      }
      if (multiple) {
        onChange([...images, ...uploaded].slice(0, max));
      } else {
        onChange(uploaded[0]);
      }
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(idx) {
    if (multiple) onChange(images.filter((_, i) => i !== idx));
    else onChange(null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div key={img.publicId || idx} className="relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200">
            <Image src={img.url} alt="" width={96} height={96} className="h-24 w-24 object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-500 disabled:opacity-50"
          >
            {busy ? (
              <span className="text-xs">Uploading…</span>
            ) : (
              <span className="flex flex-col items-center gap-1">
                <UploadCloud className="h-5 w-5" />
                <span className="text-xs">Add</span>
              </span>
            )}
          </button>
        )}

        {images.length === 0 && !canAdd && (
          <div className="grid h-24 w-24 place-items-center rounded-xl border border-gray-200 text-gray-300">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={handleFiles}
      />
      {multiple && <p className="mt-1.5 text-xs text-gray-400">Up to {max} images.</p>}
    </div>
  );
}

function toDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function postUpload(image, folder) {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, folder }),
  });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body.message || "Upload failed");
  return body.data;
}
