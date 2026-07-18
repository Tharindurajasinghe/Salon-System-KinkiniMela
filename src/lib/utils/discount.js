/**
 * Bill-level discount distribution, implementing the exact formulas from the
 * project specification.
 *
 * For each line item:
 *   Item Discount        = (Item Total Selling / Bill Total Before Discount) * Bill Discount
 *   Profit After Disc.   = (Item Total Selling - Item Discount) - Item Total Cost
 *   Profit Reduction     = Profit Before Discount - Profit After Discount
 */

/** Convert a percentage or fixed discount into an absolute LKR amount. */
export function resolveBillDiscount({ type, value, billTotal }) {
  if (type === "percentage") return (billTotal * value) / 100;
  return Math.min(value, billTotal); // fixed amount, never exceeds bill
}

/**
 * @param items  [{ sellingPrice, cost, qty }]
 * @param billDiscount { type: "percentage"|"amount", value: number }
 */
export function applyBillDiscount(items, billDiscount) {
  const billTotalBefore = items.reduce(
    (sum, it) => sum + it.sellingPrice * it.qty,
    0
  );

  const totalDiscount = resolveBillDiscount({
    ...billDiscount,
    billTotal: billTotalBefore,
  });

  const lines = items.map((it) => {
    const itemSelling = it.sellingPrice * it.qty;
    const itemCost = it.cost * it.qty;

    const itemDiscount =
      billTotalBefore > 0
        ? (itemSelling / billTotalBefore) * totalDiscount
        : 0;

    const profitBefore = itemSelling - itemCost;
    const profitAfter = itemSelling - itemDiscount - itemCost;

    return {
      ...it,
      itemSelling,
      itemCost,
      itemDiscount: round2(itemDiscount),
      profitBefore: round2(profitBefore),
      profitAfter: round2(profitAfter),
      profitReduction: round2(profitBefore - profitAfter),
    };
  });

  return {
    billTotalBefore: round2(billTotalBefore),
    totalDiscount: round2(totalDiscount),
    grandTotal: round2(billTotalBefore - totalDiscount),
    lines,
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
