import connectDB from "@/lib/db";
import Booking from "@/lib/models/Booking";
import Order from "@/lib/models/Order";
import { todaySLKey } from "@/lib/utils/timezone";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * Daily maintenance cron (wired up in vercel.json).
 *
 * Runs once a day at 18:30 UTC = 00:00 Sri Lanka time (start of the SL day) and
 * auto-closes anything that expired without being confirmed:
 *   - pending service/package bookings whose date has already passed
 *   - pending product pre-orders whose pickup date has already passed
 *
 * These are marked "rejected" with a note so they stop cluttering the Orders
 * page and the Calendar. We deliberately do NOT send SMS here (a batch job
 * texting every stale record would be spammy) — staff can still reject
 * manually from the Orders page if they want the customer notified.
 *
 * Security: Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`
 * when the CRON_SECRET env var is set. We reject any request that doesn't match,
 * so the endpoint can't be triggered by outsiders. In local dev (no secret set)
 * it is allowed through for convenience.
 */
export const dynamic = "force-dynamic";

async function handler(req) {
  // --- verify the request really came from Vercel Cron ---
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return fail("Unauthorized", 401);
  }

  await connectDB();
  const today = todaySLKey(); // "yyyy-MM-dd" in Colombo time

  // Close expired pending bookings (date strictly before today).
  const bookings = await Booking.updateMany(
    { status: "pending", date: { $lt: today } },
    { $set: { status: "rejected", rejectReason: "Auto-closed: date passed without confirmation" } }
  );

  // Close expired pending product pre-orders (pickup date before today).
  const orders = await Order.updateMany(
    { status: "pending", pickupDate: { $lt: today } },
    { $set: { status: "rejected", rejectReason: "Auto-closed: pickup date passed without confirmation" } }
  );

  return ok({
    ranAt: new Date().toISOString(),
    slDate: today,
    closedBookings: bookings.modifiedCount || 0,
    closedOrders: orders.modifiedCount || 0,
  }, "Daily maintenance complete");
}

// Vercel Cron invokes the endpoint with GET.
export const GET = withErrorHandler(handler);
