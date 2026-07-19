import connectDB from "@/lib/db";
import Booking from "@/lib/models/Booking";
import Order from "@/lib/models/Order";
import Bill from "@/lib/models/Bill";
import DressOrder from "@/lib/models/DressOrder";
import { requireAuth, canAccess } from "@/lib/auth";
import { smsService } from "@/lib/services/SmsService";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "orders")) return { error: "Not allowed", status: 403 };
  return { session };
}

/**
 * GET /api/admin/orders?type=all|service|package|product|bill
 * Returns one unified, date-sorted list combining service/package bookings,
 * product pre-orders and POS bills — each row carries its full document in
 * `raw` for the details view / receipt printing.
 */
async function getHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const type = new URL(req.url).searchParams.get("type") || "all";
  const rows = [];

  if (["all", "service", "package"].includes(type)) {
    const q = type === "all" ? {} : { itemType: type };
    const bookings = await Booking.find(q).sort({ createdAt: -1 }).lean();
    bookings.forEach((b) =>
      rows.push({
        rowType: "booking", kind: b.itemType, _id: b._id, code: b.bookingId,
        name: b.itemName, date: b.date, timeSlot: b.timeSlot, status: b.status,
        customerName: `${b.customer?.firstName || ""} ${b.customer?.lastName || ""}`.trim(),
        customerPhone: b.customer?.phone || "", createdAt: b.createdAt, raw: b,
      })
    );
  }

  if (["all", "product"].includes(type)) {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    orders.forEach((o) =>
      rows.push({
        rowType: "order", kind: "product", _id: o._id, code: o.orderId,
        name: o.items.map((i) => `${i.name} x${i.qty}`).join(", "),
        date: o.pickupDate, status: o.status,
        customerName: `${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`.trim(),
        customerPhone: o.customer?.phone || "", createdAt: o.createdAt, raw: o,
      })
    );
  }

  if (["all", "dressjewelry"].includes(type)) {
    const dress = await DressOrder.find().sort({ createdAt: -1 }).lean();
    dress.forEach((o) =>
      rows.push({
        rowType: "dressorder", kind: "dressjewelry", _id: o._id, code: o.orderId,
        name: `${o.itemName} - ${o.variantName} x${o.qty}`, date: o.bringDate, status: o.status,
        customerName: `${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`.trim(),
        customerPhone: o.customer?.phone || "", createdAt: o.createdAt, raw: o,
      })
    );
  }

  if (["all", "bill"].includes(type)) {
    const bills = await Bill.find().sort({ createdAt: -1 }).lean();
    bills.forEach((bl) =>
      rows.push({
        rowType: "bill", kind: "bill", _id: bl._id, code: bl.billId,
        name: "POS Sale", date: null, status: "paid",
        customerName: bl.customerName || "", customerPhone: bl.customerPhone || "",
        createdAt: bl.createdAt, raw: bl,
      })
    );
  }

  rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return ok(rows);
}

/**
 * PUT /api/admin/orders — change a booking/order status.
 * Body: { rowType: "booking"|"order", id, status: "confirm"|"rejected", rejectReason? }
 * Sends the customer an SMS on confirm/reject.
 */
async function putHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { rowType, id, status, rejectReason } = await req.json();
  if (!["booking", "order", "dressorder"].includes(rowType)) return fail("Bills cannot change status", 400);
  if (!["pending", "confirm", "rejected"].includes(status)) return fail("Invalid status", 400);
  if (status === "rejected" && !rejectReason?.trim()) return fail("A reject reason is required", 400);

  const Model = rowType === "booking" ? Booking : rowType === "dressorder" ? DressOrder : Order;
  const doc = await Model.findById(id);
  if (!doc) return fail("Not found", 404);

  doc.status = status;
  if (status === "rejected") doc.rejectReason = rejectReason.trim();
  await doc.save();

  const phone = doc.customer?.phone;
  const humanId = rowType === "booking" ? doc.bookingId : doc.orderId;
  const smsType = rowType === "order" ? "order" : "booking";
  if (phone) {
    if (status === "confirm") smsService.statusConfirmed(phone, { type: smsType, id: humanId }).catch(() => {});
    if (status === "rejected") smsService.statusRejected(phone, { type: smsType, id: humanId, reason: rejectReason.trim() }).catch(() => {});
  }

  return ok({ id, status }, "Status updated");
}

/** DELETE /api/admin/orders?rowType=&id=... — remove a booking/order/bill. */
async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const sp = new URL(req.url).searchParams;
  const rowType = sp.get("rowType");
  const id = sp.get("id");
  if (!id) return fail("id is required", 400);

  const Model = rowType === "booking" ? Booking : rowType === "order" ? Order : rowType === "dressorder" ? DressOrder : rowType === "bill" ? Bill : null;
  if (!Model) return fail("Invalid rowType", 400);

  await Model.findByIdAndDelete(id);
  // Summaries read live from the collections, so deleting here updates them.
  return ok(null, "Removed");
}

export const GET = withErrorHandler(getHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
