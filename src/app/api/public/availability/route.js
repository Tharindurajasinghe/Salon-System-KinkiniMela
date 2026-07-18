import connectDB from "@/lib/db";
import Service from "@/lib/models/Service";
import Package from "@/lib/models/Package";
import Booking from "@/lib/models/Booking";
import Holiday from "@/lib/models/Holiday";
import { todaySLKey, dateKey } from "@/lib/utils/timezone";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * GET /api/public/availability?itemType=service|package&itemId=..&date=yyyy-MM-dd
 * Returns the bookable time slots for that item on that day.
 * Rules: no past/today bookings, no holidays, and slots already taken by a
 * pending/confirmed booking are removed.
 */
async function handler(req) {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const itemType = sp.get("itemType");
  const itemId = sp.get("itemId");
  const date = sp.get("date");

  if (!["service", "package"].includes(itemType) || !itemId || !date)
    return fail("itemType, itemId and date are required", 400);

  // Customers cannot book today or a past day (per spec).
  if (dateKey(date) <= todaySLKey()) return ok({ available: [], allSlots: [], reason: "past_or_today" });

  // Blocked if the salon marked it a holiday.
  const holiday = await Holiday.findOne({ date: dateKey(date) }).lean();
  if (holiday) return ok({ available: [], allSlots: [], reason: "holiday" });

  const item =
    itemType === "service"
      ? await Service.findOne({ _id: itemId, active: true }).select("timeSlots").lean()
      : await Package.findOne({ _id: itemId, active: true }).select("timeSlots").lean();
  if (!item) return fail("Item not found", 404);

  const allSlots = item.timeSlots || [];

  // Slots already taken by a live booking for this item on this date.
  const taken = await Booking.find({
    itemRef: itemId,
    date: dateKey(date),
    status: { $in: ["pending", "confirm"] },
  }).select("timeSlot").lean();
  const takenSet = new Set(taken.map((b) => b.timeSlot));

  const available = allSlots.filter((s) => !takenSet.has(s));
  return ok({ available, allSlots });
}
export const GET = withErrorHandler(handler);
