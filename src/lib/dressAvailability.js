import DressJewelry from "@/lib/models/DressJewelry";
import DressOrder from "@/lib/models/DressOrder";
import Bill from "@/lib/models/Bill";

/**
 * Two inclusive date ranges overlap when each starts on or before the other
 * ends. yyyy-MM-dd strings compare correctly lexicographically.
 */
export function rangesOverlap(b1, d1, b2, d2) {
  return b1 <= d2 && b2 <= d1;
}

/**
 * Units of a variant still available for a [bring, deliver] window.
 * Counts overlapping active web rentals (pending/confirm) AND overlapping
 * dress lines on POS bills — so manual billing and online bookings share the
 * same stock. `excludeOrderId` lets an order ignore itself when re-checking.
 */
export async function variantAvailability(itemId, variantName, bring, deliver, excludeOrderId = null) {
  const item = await DressJewelry.findById(itemId).lean();
  if (!item) return { ok: false, available: 0, stock: 0 };
  const variant = (item.variants || []).find((v) => v.name === variantName);
  if (!variant) return { ok: false, available: 0, stock: 0 };
  const stock = variant.stock || 0;

  let occupied = 0;

  // Web rentals overlapping the window.
  const orders = await DressOrder.find({
    itemRef: itemId,
    variantName,
    status: { $in: ["pending", "confirm"] },
    ...(excludeOrderId ? { _id: { $ne: excludeOrderId } } : {}),
  }).select("qty bringDate deliverDate").lean();
  for (const o of orders) {
    if (rangesOverlap(bring, deliver, o.bringDate, o.deliverDate)) occupied += o.qty || 0;
  }

  // POS bill dress lines overlapping the window.
  const bills = await Bill.find({ "items.kind": "dressjewelry", "items.ref": itemId }).select("items").lean();
  for (const b of bills) {
    for (const it of b.items || []) {
      if (
        it.kind === "dressjewelry" &&
        String(it.ref) === String(itemId) &&
        it.variantName === variantName &&
        it.bringDate && it.deliverDate &&
        rangesOverlap(bring, deliver, it.bringDate, it.deliverDate)
      ) {
        occupied += it.qty || 0;
      }
    }
  }

  return { ok: true, stock, available: Math.max(0, stock - occupied) };
}
