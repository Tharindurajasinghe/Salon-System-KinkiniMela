import connectDB from "@/lib/db";
import Bill from "@/lib/models/Bill";
import { requireAuth, canAccess } from "@/lib/auth";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "customers")) return { error: "Not allowed", status: 403 };
  return { session };
}

/**
 * POST /api/admin/customers/payment
 * Body: { customerId, amount, note? }
 * Records an installment and allocates it across the customer's outstanding
 * credit bills oldest-first. Rejects amounts larger than the total owed.
 */
async function handler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { customerId, amount, note } = await req.json();
  let remaining = Math.round(Number(amount) * 100) / 100;
  if (!customerId) return fail("customerId is required", 400);
  if (!remaining || remaining <= 0) return fail("Enter a valid amount", 400);

  // Oldest unpaid credit bills first.
  const bills = await Bill.find({ customer: customerId, isCredit: true }).sort({ createdAt: 1 });
  const outstanding = bills.filter((b) => b.grandTotal - b.paidAmount > 0.0001);

  const totalDue = outstanding.reduce((s, b) => s + (b.grandTotal - b.paidAmount), 0);
  if (remaining > totalDue + 0.0001) return fail("Amount exceeds the balance due", 400);

  for (const bill of outstanding) {
    if (remaining <= 0.0001) break;
    const billBalance = bill.grandTotal - bill.paidAmount;
    const apply = Math.min(remaining, billBalance);
    bill.paidAmount = Math.round((bill.paidAmount + apply) * 100) / 100;
    bill.payments.push({ amount: Math.round(apply * 100) / 100, note: note || "Payment" });
    if (bill.paidAmount >= bill.grandTotal - 0.0001) bill.status = "paid";
    await bill.save();
    remaining = Math.round((remaining - apply) * 100) / 100;
  }

  const newDue = Math.round(
    (await Bill.find({ customer: customerId, isCredit: true }).lean()).reduce(
      (s, b) => s + (b.grandTotal - b.paidAmount), 0
    ) * 100
  ) / 100;

  return ok({ balanceDue: newDue }, "Payment recorded");
}

export const POST = withErrorHandler(handler);
