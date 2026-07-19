"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Ban, CalendarClock, Gem } from "lucide-react";
import clsx from "clsx";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/utils/apiClient";
import { currentMonthSLKey, todaySLKey } from "@/lib/utils/timezone";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STATUS_DOT = { pending: "bg-amber-400", confirm: "bg-green-500", rejected: "bg-red-400" };

export default function CalendarPage() {
  const [month, setMonth] = useState(currentMonthSLKey());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // date string
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try { setData(await api.get(`/api/admin/calendar?month=${month}`)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load().catch(() => setData({ holidays: [], days: {} })); }, [month]); // eslint-disable-line

  const [year, mon] = month.split("-").map(Number);
  const holidaySet = useMemo(() => new Set((data?.holidays || []).map((h) => h.date)), [data]);
  const days = data?.days || {};

  // Build the calendar grid cells.
  const cells = useMemo(() => {
    const first = new Date(year, mon - 1, 1).getDay();
    const total = new Date(year, mon, 0).getDate();
    const arr = Array.from({ length: first }, () => null);
    for (let d = 1; d <= total; d++) arr.push(d);
    return arr;
  }, [year, mon]);

  const keyFor = (d) => `${month}-${String(d).padStart(2, "0")}`;
  const shiftMonth = (delta) => {
    let m = mon + delta, y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  async function toggleHoliday(date) {
    setBusy(true);
    try {
      if (holidaySet.has(date)) await api.del(`/api/holidays?date=${date}`);
      else await api.post("/api/holidays", { date });
      await load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  const selectedBookings = selected ? (days[selected] || []) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-gray-900">{MONTHS[mon - 1]} {year}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => shiftMonth(-1)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setMonth(currentMonthSLKey())} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Today</button>
          <button onClick={() => shiftMonth(1)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-brand-400"><Spinner className="h-7 w-7" /></div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-3 sm:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
            {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={`b${i}`} />;
              const date = keyFor(d);
              const isHoliday = holidaySet.has(date);
              const count = (days[date] || []).length;
              const isToday = date === todaySLKey();
              return (
                <button
                  key={date}
                  onClick={() => setSelected(date)}
                  className={clsx(
                    "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-colors",
                    isHoliday ? "border-red-200 bg-red-50" : "border-gray-100 hover:border-brand-300 hover:bg-brand-50/40",
                    isToday && "ring-2 ring-brand-400"
                  )}
                >
                  <span className={clsx("font-medium", isHoliday ? "text-red-500" : "text-gray-800")}>{d}</span>
                  {isHoliday && <Ban className="mt-0.5 h-3 w-3 text-red-400" />}
                  {count > 0 && !isHoliday && (
                    <span className="mt-0.5 rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-500" /> Bookings</span>
            <span className="flex items-center gap-1.5"><Ban className="h-3 w-3 text-red-400" /> Off day</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-brand-400" /> Today</span>
          </div>
        </div>
      )}

      {/* Day panel */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            <Button
              variant={holidaySet.has(selected) ? "outline" : "danger"}
              onClick={() => toggleHoliday(selected)}
              disabled={busy}
            >
              <Ban className="h-4 w-4" />
              {holidaySet.has(selected) ? "Remove off day" : "Mark as off day"}
            </Button>
          </>
        }
      >
        {holidaySet.has(selected) && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">This day is marked as an off day. Customers cannot book it.</p>
        )}
        {selectedBookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No bookings on this day.</p>
        ) : (
          <ul className="space-y-2">
            {selectedBookings.map((b) => (
              <li key={b.bookingId} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                <span className={clsx("grid h-9 w-9 place-items-center rounded-lg", b.type === "dress" ? "bg-amber-100 text-amber-600" : "bg-brand-50 text-brand-500")}>
                  {b.type === "dress" ? <Gem className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-gray-900">{b.itemName}</p>
                  <p className="text-xs text-gray-500">
                    {b.type === "dress"
                      ? `Rental · deliver ${b.deliverDate} · ${b.customerName} · ${b.customerPhone}`
                      : `${b.timeSlot} · ${b.customerName} · ${b.customerPhone}`}
                  </p>
                </div>
                <span className={clsx("h-2.5 w-2.5 rounded-full", STATUS_DOT[b.status] || "bg-gray-300")} title={b.status} />
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
