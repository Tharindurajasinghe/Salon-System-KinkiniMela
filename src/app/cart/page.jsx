"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle2, ImageIcon } from "lucide-react";
import PageHeader from "@/components/site/PageHeader";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageProvider";
import { useCart } from "@/context/CartProvider";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";
import { todaySLKey } from "@/lib/utils/timezone";

export default function CartPage() {
  const { t } = useLanguage();
  const { items, setQty, remove, clear, total } = useCart();

  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", pickupDate: "" });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { orderId }

  async function placeOrder() {
    setError("");
    if (!form.firstName.trim()) return setError("Please enter your first name.");
    if (!form.phone.trim() || !form.pickupDate) return setError("Please fill your phone and pickup date.");
    setPlacing(true);
    try {
      const res = await api.post("/api/orders", {
        items: items.map((i) => ({ refId: i.refId, qty: i.qty })),
        customer: { firstName: form.firstName, lastName: form.lastName, phone: form.phone },
        pickupDate: form.pickupDate,
      });
      clear();
      setDone(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  // ----- success screen -----
  if (done) {
    return (
      <div>
        <PageHeader title={t("cart.orderPlaced")} />
        <div className="mx-auto max-w-md px-6 py-10 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
          <p className="mt-4 text-lg font-medium text-gray-900">{done.orderId}</p>
          <p className="mt-3 text-gray-600">{t("cart.pendingNote")}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/bookings"><Button variant="outline">{t("nav.bookings")}</Button></Link>
            <Link href="/products"><Button>{t("cart.browseProducts")}</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  // ----- empty cart -----
  if (items.length === 0) {
    return (
      <div>
        <PageHeader title={t("cart.title")} />
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">{t("cart.empty")}</p>
          <Link href="/products" className="mt-6 inline-block"><Button>{t("cart.browseProducts")}</Button></Link>
        </div>
      </div>
    );
  }

  // ----- cart + checkout -----
  return (
    <div>
      <PageHeader title={t("cart.title")} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
          {items.map((it) => (
            <div key={it.refId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              {/* image + name (grows on desktop) */}
              <div className="flex min-w-0 items-center gap-3 sm:flex-1 sm:gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                  {it.image?.url ? <Image src={it.image.url} alt="" fill className="object-cover" sizes="64px" /> : <span className="grid h-full place-items-center text-gray-300"><ImageIcon className="h-5 w-5" /></span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium text-gray-900 sm:line-clamp-1">{it.name}</p>
                  <p className="text-sm text-brand-600">{formatRs(it.sellingPrice, 0)}</p>
                </div>
                {/* remove — mobile only, top-right of the row */}
                <button onClick={() => remove(it.refId)} className="shrink-0 p-1 text-gray-300 hover:text-red-500 sm:hidden" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
              </div>

              {/* qty + line total (+ desktop remove) */}
              <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
                <div className="flex items-center gap-1">
                  <button onClick={() => setQty(it.refId, it.qty - 1)} className="grid h-8 w-8 place-items-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-8 text-center text-sm">{it.qty}</span>
                  <button onClick={() => setQty(it.refId, it.qty + 1)} className="grid h-8 w-8 place-items-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <span className="min-w-[5rem] text-right font-medium text-gray-900 sm:w-24">{formatRs(it.sellingPrice * it.qty, 0)}</span>
                <button onClick={() => remove(it.refId)} className="hidden shrink-0 p-1 text-gray-300 hover:text-red-500 sm:block" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout */}
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex justify-between border-b border-gray-100 pb-3 text-lg font-semibold">
              <span>{t("cart.subtotal")}</span><span>{formatRs(total)}</span>
            </div>

            <p className="mt-4 text-sm font-medium text-gray-700">{t("cart.yourDetails")}</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder={t("common.firstName")} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder={t("common.lastName")} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            </div>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("common.phone")} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
            <label className="mt-3 block text-sm text-gray-600">{t("cart.pickupDate")}</label>
            <input type="date" min={todaySLKey()} value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <Button onClick={placeOrder} disabled={placing} size="lg" className="mt-4 w-full">
              {placing ? "..." : t("cart.placeOrder")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}