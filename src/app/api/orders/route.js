import connectDB from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { nextId } from "@/lib/utils/idGenerator";
import { smsService } from "@/lib/services/SmsService";
import { getSettings } from "@/lib/settings";
import { todaySLKey, dateKey } from "@/lib/utils/timezone";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * POST /api/orders — customer product pre-order (pickup only, no payment).
 * Body: { items: [{ refId, qty }], customer: { firstName, lastName, phone }, pickupDate }
 * Sends an SMS alert to the admin with the order id, item list, pickup date
 * and customer first name (per spec).
 */
async function postHandler(req) {
  await connectDB();
  const body = await req.json();

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const c = body.customer || {};
  if (rawItems.length === 0) return fail("Your cart is empty", 400);
  if (!c.firstName?.trim()) return fail("First name is required", 400);
  if (!c.phone?.trim()) return fail("Phone number is required", 400);
  if (!body.pickupDate) return fail("Pickup date is required", 400);
  if (dateKey(body.pickupDate) < todaySLKey()) return fail("Pickup date cannot be in the past", 400);

  // Resolve products (active only) and build the order lines.
  const items = [];
  let total = 0;
  for (const it of rawItems) {
    const p = await Product.findOne({ _id: it.refId, active: true }).lean();
    if (!p) return fail("One of the products is no longer available", 400);
    const qty = Math.max(1, Number(it.qty || 1));
    items.push({ productRef: p._id, name: p.name, sellingPrice: p.sellingPrice, qty });
    total += p.sellingPrice * qty;
  }

  const orderId = await nextId("ORD");
  const order = await Order.create({
    orderId,
    items,
    customer: { firstName: c.firstName.trim(), lastName: (c.lastName || "").trim(), phone: c.phone.trim() },
    pickupDate: body.pickupDate,
    total,
    status: "pending",
  });


  // SMS the admin.
  const settings = await getSettings();
  if (settings.adminSmsPhone) {
    smsService
      .newProductOrderToAdmin(settings.adminSmsPhone, {
        orderId,
        items: items.map((i) => ({ name: i.name, qty: i.qty })),
        pickupDate: body.pickupDate,
        firstName: c.firstName.trim(),
      })
      .catch(() => {});
  }

  return created({ orderId }, "Order placed");
}

export const POST = withErrorHandler(postHandler);
