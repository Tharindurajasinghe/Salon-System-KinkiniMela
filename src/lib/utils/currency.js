/**
 * Currency formatting for Sri Lankan Rupees. The whole system uses "Rs."
 *   formatRs(1500)      -> "Rs. 1,500.00"
 *   formatRs(1500, 0)   -> "Rs. 1,500"
 */
export function formatRs(amount, decimals = 2) {
  const n = Number(amount || 0);
  return (
    "Rs. " +
    n.toLocaleString("en-LK", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}
