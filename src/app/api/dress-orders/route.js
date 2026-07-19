import connectDB from "@/lib/db";
import DressJewelry from "@/lib/models/DressJewelry";
import DressOrder from "@/lib/models/DressOrder";
import { nextId } from "@/lib/utils/idGenerator";
import { smsService } from "@/lib/services/SmsService";
import { getSettings } from "@/lib/settings";
import { variantAvailability } from "@/lib/dressAvailability";
import { todaySLKey, dateKey } from "@/lib/utils/timezone";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * POST /api/dress-orders — customer rents a dress/jewelry variant for a window.
 * Body: { itemId, variantName, qty, customer:{firstName,lastName,phone}, bringDate, deliverDate }
 */
async function postHandler(req) {
  await connectDB();
  const b = await req.json();
  const c = b.customer || {};

  if (!b.itemId || !b.variantName) return fail("Please choose an item and variant", 400);
  if (!c.firstName?.trim() || !c.phone?.trim()) return fail("Name and phone are required", 400);
  if (!b.bringDate || !b.deliverDate) return fail("Bring and deliver dates are required", 400);
  const qty = Math.max(1, Number(b.qty || 1));

  const bring = dateKey(b.bringDate), deliver = dateKey(b.deliverDate);
  if (bring <= todaySLKey()) return fail("Bring date must be a future date", 400);
  if (deliver < bring) return fail("Deliver date cannot be before the bring date", 400);

  const item = await DressJewelry.findOne({ _id: b.itemId, active: true }).lean();
  if (!item) return fail("This item is no longer available", 400);
  const variant = (item.variants || []).find((v) => v.name === b.variantName);
  if (!variant) return fail("Variant not found", 400);

  // Availability across the window (web + POS).
  const { available } = await variantAvailability(b.itemId, b.variantName, bring, deliver);
  if (qty > available) return fail(`Only ${available} available for those dates`, 409);

  const orderId = await nextId("DOR");
  const order = await DressOrder.create({
    orderId,
    itemRef: item._id,
    itemName: item.name,
    variantName: variant.name,
    qty,
    unitPrice: variant.sellingPrice,
    delayChargePerDay: item.delayChargePerDay || 0,
    customer: { firstName: c.firstName.trim(), lastName: (c.lastName || "").trim(), phone: c.phone.trim() },
    bringDate: bring,
    deliverDate: deliver,
    status: "pending",
  });

  // SMS both parties.
  const settings = await getSettings();
  smsService.send(c.phone.trim(), `Your booking is pending. After admin approval you will receive a message. Booking ID: ${orderId}.`).catch(() => {});
  if (settings.adminSmsPhone) {
    smsService.send(settings.adminSmsPhone, `New dress/jewelry booking (${orderId}): ${item.name} - ${variant.name} x${qty}. Bring ${bring}, deliver ${deliver}. ${c.firstName.trim()} (${c.phone.trim()}).`).catch(() => {});
  }

  return created({ orderId }, "Booking placed");
}

export const POST = withErrorHandler(postHandler);
