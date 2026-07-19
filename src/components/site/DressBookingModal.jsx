"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CalendarPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useLanguage } from "@/context/LanguageProvider";
import { api } from "@/lib/utils/apiClient";
import { formatRs } from "@/lib/utils/currency";

// yyyy-MM-dd for (today + n days).
function dayOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Customer-facing rental booking for one dress/jewelry item. */
export default function DressBookingModal({ open, item, onClose }) {
  const { t } = useLanguage();
  const tomorrow = dayOffset(1);

  const [variantName, setVariantName] = useState("");
  const [bringDate, setBringDate] = useState(tomorrow);
  const [deliverDate, setDeliverDate] = useState(tomorrow);
  const [qty, setQty] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [avail, setAvail] = useState(null); // {available, stock} | null
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // orderId

  useEffect(() => {
    if (open && item) {
      setVariantName(item.variants?.[0]?.name || "");
      setBringDate(tomorrow); setDeliverDate(tomorrow); setQty(1);
      setFirstName(""); setPhone(""); setAvail(null); setError(""); setDone(null);
    }
  }, [open, item]); // eslint-disable-line

  // Re-check availability whenever variant/dates change.
  useEffect(() => {
    if (!open || !item || !variantName) return;
    if (bringDate <= new Date().toISOString().slice(0, 10)) { setAvail(null); return; }
    if (deliverDate < bringDate) { setAvail(null); return; }
    let active = true;
    setChecking(true);
    api.get(`/api/public/dress-availability?itemId=${item._id}&variant=${encodeURIComponent(variantName)}&bring=${bringDate}&deliver=${deliverDate}`)
      .then((r) => active && setAvail(r)).catch(() => active && setAvail(null)).finally(() => active && setChecking(false));
    return () => { active = false; };
  }, [open, item, variantName, bringDate, deliverDate]);

  async function submit() {
    setError("");
    if (!firstName.trim() || !phone.trim()) return setError("Please enter your name and phone.");
    if (bringDate <= new Date().toISOString().slice(0, 10)) return setError("Bring date must be a future date.");
    if (deliverDate < bringDate) return setError("Deliver date cannot be before the bring date.");
    if (avail && qty > avail.available) return setError(t("dress.notEnough"));
    setSubmitting(true);
    try {
      const res = await api.post("/api/dress-orders", {
        itemId: item._id, variantName, qty: Number(qty),
        customer: { firstName: firstName.trim(), phone: phone.trim() },
        bringDate, deliverDate,
      });
      setDone(res.orderId);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  if (!item) return null;
  const variant = item.variants.find((v) => v.name === variantName);

  return (
    <Modal open={open} onClose={onClose} title={done ? "" : `${t("common.bookNow")} — ${item.name}`}>
      {done ? (
        <div className="py-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-3 font-medium text-gray-900">Booking placed!</p>
          <p className="mt-1 text-sm text-gray-500">Your booking ID is <span className="font-mono font-semibold">{done}</span>. We'll confirm by SMS after review.</p>
          <Button className="mt-4" onClick={onClose}>Done</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <Select label={t("dress.selectVariant")} value={variantName} onChange={(e) => setVariantName(e.target.value)}>
            {item.variants.map((v) => <option key={v._id} value={v.name}>{v.name} — {formatRs(v.sellingPrice, 0)}</option>)}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t("dress.bringDate")} type="date" min={tomorrow} value={bringDate} onChange={(e) => { setBringDate(e.target.value); if (deliverDate < e.target.value) setDeliverDate(e.target.value); }} />
            <Input label={t("dress.deliverDate")} type="date" min={bringDate} value={deliverDate} onChange={(e) => setDeliverDate(e.target.value)} />
          </div>

          <Input label={t("dress.noOfItems")} type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />

          {/* Availability feedback */}
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
            {checking ? <span className="text-gray-400">Checking…</span>
              : avail?.reason === "holiday" ? <span className="text-red-500">The salon is closed on that day — pick another bring date.</span>
              : avail ? (
                avail.available >= qty
                  ? <span className="text-green-600">{avail.available} {t("dress.available")} for these dates ✓</span>
                  : <span className="text-red-500">{avail.available} {t("dress.available")} — {t("dress.notEnough")}</span>
              ) : <span className="text-gray-400">Pick future dates to check availability.</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Your name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {variant && (
            <div className="flex justify-between rounded-xl bg-brand-50 px-4 py-2.5 text-sm">
              <span className="text-gray-600">Estimated ({qty} × {formatRs(variant.sellingPrice, 0)})</span>
              <span className="font-semibold text-gray-900">{formatRs(variant.sellingPrice * qty, 0)}</span>
            </div>
          )}

          <Button className="w-full" onClick={submit} disabled={submitting || (avail && qty > avail.available)}>
            <CalendarPlus className="h-4 w-4" /> {submitting ? "..." : t("common.bookNow")}
          </Button>
        </div>
      )}
    </Modal>
  );
}
