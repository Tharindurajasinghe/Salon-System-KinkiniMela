"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingBag, Check, ImageIcon } from "lucide-react";
import DiscountBadge from "./DiscountBadge";
import { useCart } from "@/context/CartProvider";
import { useLanguage } from "@/context/LanguageProvider";
import { formatRs } from "@/lib/utils/currency";

/** Product card with discount label and add-to-cart (pre-order). */
export default function ProductCard({ product }) {
  const { add } = useCart();
  const { t } = useLanguage();
  const [added, setAdded] = useState(false);

  const pct = product.discount?.percentage || 0;
  const finalPrice = pct ? product.sellingPrice * (1 - pct / 100) : product.sellingPrice;
  const outOfStock = product.stock <= 0;

  function handleAdd() {
    add({ refId: product._id, name: product.name, sellingPrice: finalPrice, image: product.image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-gray-50">
        <DiscountBadge discount={product.discount} />
        {product.image?.url ? (
          <Image src={product.image.url} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="300px" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-gray-200"><ImageIcon className="h-9 w-9" /></span>
        )}
      </div>
      <div className="p-4">
        {product.category?.name && <p className="text-xs uppercase tracking-wide text-gray-400">{product.category.name}</p>}
        <p className="line-clamp-1 font-medium text-gray-900">{product.name}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-brand-600">{formatRs(finalPrice, 0)}</span>
          {pct > 0 && <span className="text-xs text-gray-400 line-through">{formatRs(product.sellingPrice, 0)}</span>}
        </div>
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {outOfStock ? t("products.outOfStock") : added ? (<><Check className="h-4 w-4" /> {t("products.added")}</>) : (<><ShoppingBag className="h-4 w-4" /> {t("common.addToCart")}</>)}
        </button>
      </div>
    </div>
  );
}
