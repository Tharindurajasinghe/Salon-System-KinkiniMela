"use client";

import { useState } from "react";
import { Plus, X, Clock } from "lucide-react";

/**
 * Editor for a list of start-time slots (e.g. "10:00 AM", "11:30 AM").
 * value = string[], onChange(string[]). Used by services and packages.
 * Slots are kept sorted by actual time so the admin always sees them in order.
 */
export default function TimeSlotsEditor({ value = [], onChange }) {
  const [hour, setHour] = useState("10");
  const [minute, setMinute] = useState("00");
  const [meridiem, setMeridiem] = useState("AM");

  function add() {
    const slot = `${hour}:${minute} ${meridiem}`;
    if (value.includes(slot)) return;
    onChange(sortSlots([...value, slot]));
  }

  function remove(slot) {
    onChange(value.filter((s) => s !== slot));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select className="rounded-lg border border-gray-200 px-2 py-2 text-sm" value={hour} onChange={(e) => setHour(e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-gray-400">:</span>
        <select className="rounded-lg border border-gray-200 px-2 py-2 text-sm" value={minute} onChange={(e) => setMinute(e.target.value)}>
          {["00", "15", "30", "45"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select className="rounded-lg border border-gray-200 px-2 py-2 text-sm" value={meridiem} onChange={(e) => setMeridiem(e.target.value)}>
          <option>AM</option>
          <option>PM</option>
        </select>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100"
        >
          <Plus className="h-4 w-4" /> Add slot
        </button>
      </div>

      {value.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((slot) => (
            <span key={slot} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-3 pr-1.5 text-sm text-gray-700">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {slot}
              <button type="button" onClick={() => remove(slot)} className="grid h-5 w-5 place-items-center rounded-full hover:bg-gray-200" aria-label={`Remove ${slot}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-gray-400">No time slots yet.</p>
      )}
    </div>
  );
}

// Sort "hh:mm AM/PM" strings chronologically.
function sortSlots(slots) {
  const toMinutes = (s) => {
    const [time, mer] = s.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (mer === "PM" && h !== 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };
  return [...slots].sort((a, b) => toMinutes(a) - toMinutes(b));
}
