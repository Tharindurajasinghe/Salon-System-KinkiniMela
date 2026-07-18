"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CalendarClock } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageProvider";
import { api } from "@/lib/utils/apiClient";
import { todaySLKey } from "@/lib/utils/timezone";

/**
 * Booking flow for a service or package:
 *   details → pick a future date → live available slots → confirm.
 * Enforces the same rules as the server (today/past + holidays blocked, taken
 * slots hidden) and shows a booking id on success.
 */
export default function BookingModal({ open, item, itemType, onClose }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", gender: "", date: "" });
  const [holidays, setHolidays] = useState(new Set());
  const [slots, setSlots] = useState(null); // null=not loaded, []=none
  const [slotReason, setSlotReason] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  // Reset whenever a new item is opened.
  useEffect(() => {
    if (open) {
      setForm({ firstName: "", lastName: "", phone: "", gender: "", date: "" });
      setSlots(null); setSelectedSlot(""); setSlotReason(""); setError(""); setDone(null);
    }
  }, [open, item?._id]);

  useEffect(() => {
    api.get("/api/public/holidays").then((h) => setHolidays(new Set(h.map((x) => x.date)))).catch(() => {});
  }, []);

  const minDate = useMemo(() => addDays(todaySLKey(), 1), []);

  // Fetch availability when a valid date is chosen.
  useEffect(() => {
    if (!open || !item?._id || !form.date) { setSlots(null); return; }
    if (holidays.has(form.date)) { setSlots([]); setSlotReason("holiday"); return; }
    let active = true;
    setLoadingSlots(true); setSlotReason(""); setSelectedSlot("");
    api
      .get(`/api/public/availability?itemType=${itemType}&itemId=${item._id}&date=${form.date}`)
      .then((d) => { if (active) { setSlots(d.available); setSlotReason(d.reason || ""); } })
      .catch(() => active && setSlots([]))
      .finally(() => active && setLoadingSlots(false));
    return () => { active = false; };
  }, [open, item?._id, itemType, form.date, holidays]);

  async function confirm() {
    setError("");
    if (!form.firstName.trim() || !form.phone.trim()) return setError("Please enter your name and phone.");
    if (!form.date || !selectedSlot) return setError("Please choose a date and time.");
    setSubmitting(true);
    try {
      const res = await api.post("/api/bookings", {
        itemType, itemId: item._id,
        customer: { firstName: form.firstName, lastName: form.lastName, phone: form.phone, gender: form.gender },
        date: form.date, timeSlot: selectedSlot,
      });
      setDone(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={done ? t("cart.orderPlaced") : item?.name}
      footer={
        done ? (
          <Button onClick={onClose}>{t("common.close")}</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={submitting}>{t("common.cancel")}</Button>
            <Button onClick={confirm} disabled={submitting || !selectedSlot}>
              {submitting ? "..." : t("common.confirm")}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="py-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-3 font-medium text-gray-900">{done.bookingId}</p>
          <p className="mt-2 text-sm text-gray-600">{t("cart.pendingNote")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <input className={field} placeholder={t("common.firstName")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <input className={field} placeholder={t("common.lastName")} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <input className={field} placeholder={t("common.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          <div className="flex gap-2">
            {["male", "female"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setForm({ ...form, gender: g })}
                className={
                  "flex-1 rounded-xl border py-2 text-sm font-medium capitalize transition-colors " +
                  (form.gender === g ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-200 text-gray-600 hover:border-brand-300")
                }
              >
                {t(`common.${g}`)}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("common.date")}</label>
            <input type="date" min={minDate} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={field} />
          </div>

          {/* Slots */}
          {form.date && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("common.time")}</label>
              {loadingSlots ? (
                <div className="grid place-items-center py-6 text-brand-400"><Spinner /></div>
              ) : slotReason === "holiday" ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">The salon is closed on this day.</p>
              ) : slotReason === "past_or_today" ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">Please choose a future date.</p>
              ) : slots && slots.length === 0 ? (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">No time slots available for this day.</p>
              ) : slots ? (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSlot(s)}
                      className={
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors " +
                        (selectedSlot === s ? "border-brand-500 bg-brand-500 text-white" : "border-gray-200 text-gray-700 hover:border-brand-300")
                      }
                    >
                      <CalendarClock className="h-3.5 w-3.5" /> {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

const field =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

// Add N days to a "yyyy-MM-dd" string.
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
