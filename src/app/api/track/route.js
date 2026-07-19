import connectDB from "@/lib/db";
import Order from "@/lib/models/Order";
import Booking from "@/lib/models/Booking";
import DressOrder from "@/lib/models/DressOrder";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * GET /api/track?phone=... — a customer's product orders and bookings, so they
 * can see status (pending / confirm / rejected) on the "Your Bookings" page.
 */
async function handler(req) {
  await connectDB();
  const phone = new URL(req.url).searchParams.get("phone")?.trim();
  if (!phone) return fail("Enter your phone number", 400);

  const [orders, bookings, dressOrders] = await Promise.all([
    Order.find({ "customer.phone": phone }).sort({ createdAt: -1 }).lean(),
    Booking.find({ "customer.phone": phone }).sort({ createdAt: -1 }).lean(),
    DressOrder.find({ "customer.phone": phone }).sort({ createdAt: -1 }).lean(),
  ]);

  return ok({ orders, bookings, dressOrders });
}
export const GET = withErrorHandler(handler);
