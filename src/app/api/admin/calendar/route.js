import connectDB from "@/lib/db";
import Booking from "@/lib/models/Booking";
import Holiday from "@/lib/models/Holiday";
import { requireAuth, canAccess } from "@/lib/auth";
import { currentMonthSLKey } from "@/lib/utils/timezone";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "calendar")) return { error: "Not allowed", status: 403 };
  return { session };
}

/**
 * GET /api/admin/calendar?month=yyyy-MM
 * Returns the month's holidays and its bookings grouped by day, so the admin
 * can see at a glance which days have appointments and which are off days.
 */
async function handler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const month = new URL(req.url).searchParams.get("month") || currentMonthSLKey();

  const [holidays, bookings] = await Promise.all([
    Holiday.find({ date: { $regex: `^${month}` } }).lean(),
    Booking.find({ date: { $regex: `^${month}` } }).sort({ timeSlot: 1 }).lean(),
  ]);

  // Group bookings by their date string.
  const days = {};
  for (const b of bookings) {
    (days[b.date] ||= []).push({
      bookingId: b.bookingId,
      itemType: b.itemType,
      itemName: b.itemName,
      timeSlot: b.timeSlot,
      status: b.status,
      customerName: `${b.customer?.firstName || ""} ${b.customer?.lastName || ""}`.trim(),
      customerPhone: b.customer?.phone || "",
    });
  }

  return ok({ month, holidays, days });
}
export const GET = withErrorHandler(handler);
