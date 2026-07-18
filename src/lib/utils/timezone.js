import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * All date/time logic in this system is anchored to Sri Lanka time.
 * Sri Lanka = Asia/Colombo = UTC+5:30, no daylight saving.
 *
 * Rule of thumb:
 *  - Store dates in MongoDB as UTC (default).
 *  - Convert to Colombo time only for display / "today" comparisons.
 */
export const SL_TZ = "Asia/Colombo";

/** Current moment as a Date, but interpreted in Colombo wall-clock time. */
export function nowInSL() {
  return toZonedTime(new Date(), SL_TZ);
}

/** Returns today's date key in Colombo time, e.g. "2026-07-05". */
export function todaySLKey() {
  return formatInTimeZone(new Date(), SL_TZ, "yyyy-MM-dd");
}

/** Format any date in Colombo time. Default -> "2026-07-05 03:45 PM". */
export function formatSL(date, pattern = "yyyy-MM-dd hh:mm a") {
  return formatInTimeZone(date, SL_TZ, pattern);
}

/** Turn a "yyyy-MM-dd" booking date string into a comparable day key. */
export function dateKey(dateString) {
  return formatInTimeZone(new Date(dateString), SL_TZ, "yyyy-MM-dd");
}

/** True if the given date string is in the past or is today (SL time). */
export function isTodayOrPast(dateString) {
  return dateKey(dateString) <= todaySLKey();
}

/**
 * UTC [start, end) range covering a single Sri Lanka calendar day.
 * Used to query bills stored in UTC by their Colombo-local day.
 */
export function slDayRangeUtc(dateStr) {
  const start = fromZonedTime(`${dateStr}T00:00:00`, SL_TZ);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** UTC [start, end) range covering a Sri Lanka calendar month ("yyyy-MM"). */
export function slMonthRangeUtc(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const start = fromZonedTime(`${monthStr}-01T00:00:00`, SL_TZ);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const end = fromZonedTime(`${nextMonth}-01T00:00:00`, SL_TZ);
  return { start, end };
}

/** Current month key in Colombo time, e.g. "2026-07". */
export function currentMonthSLKey() {
  return formatInTimeZone(new Date(), SL_TZ, "yyyy-MM");
}
