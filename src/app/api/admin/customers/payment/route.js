import connectDB from "@/lib/db";
import Bill from "@/lib/models/Bill";
import Customer from "@/lib/models/Customer";
import { requireAuth, canAccess } from "@/lib/auth";
import { todaySLKey } from "@/lib/utils/timezone";
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
 *
 * Total owed = outstanding bill balances + outstanding delay charges.
 * A payment is applied to bill balances oldest-first; any remainder settles the
 * dress/jewelry late-return (delay) charges and is recorded on the customer.
 */
async function handler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { customerId, amount, note } = await req.json();
  let remaining = round2(Number(amount));
  if (!customerId) return fail("customerId is required", 400);
  if (!remaining || remaining <= 0) return fail("Enter a valid amount", 400);

  const customer = await Customer.findById(customerId);
  if (!customer) return fail("Customer not found", 404);

  // Oldest unpaid credit bills first.
  const bills = await Bill.find({ customer: customerId, isCredit: true }).sort({ createdAt: 1 });
  const outstanding = bills.filter((b) => b.grandTotal - b.paidAmount > 0.0001);
  const billBalance = round2(outstanding.reduce((s, b) => s + (b.grandTotal - b.paidAmount), 0));

  // Outstanding delay charges = gross computed delay - delay already paid.
  const today = todaySLKey();
  let delayGross = 0;
  bills.forEach((b) => {
    (b.items || []).forEach((it) => {
      if (it.kind === "dressjewelry" && it.deliverDate) {
        const overdueDays = Math.max(0, daysBetween(it.deliverDate, today));
        delayGross += overdueDays * (it.delayChargePerDay || 0) * (it.qty || 1);
      }
    });
  });
  const delayPaid = round2((customer.delayPayments || []).reduce((s, p) => s + (p.amount || 0), 0));
  const delayDue = Math.max(0, round2(delayGross - delayPaid));

  const totalDue = round2(billBalance + delayDue);
  if (remaining > totalDue + 0.0001) return fail("Amount exceeds the balance due", 400);

  // 1) Pay down bills oldest-first.
  for (const bill of outstanding) {
    if (remaining <= 0.0001) break;
    const bal = bill.grandTotal - bill.paidAmount;
    const apply = Math.min(remaining, bal);
    bill.paidAmount = round2(bill.paidAmount + apply);
    bill.payments.push({ amount: round2(apply), note: note || "Payment" });
    if (bill.paidAmount >= bill.grandTotal - 0.0001) bill.status = "paid";
    await bill.save();
    remaining = round2(remaining - apply);
  }

  // 2) Any remainder settles delay charges.
  if (remaining > 0.0001) {
    customer.delayPayments.push({ amount: round2(remaining), note: note || "Delay charge payment" });
    await customer.save();
    remaining = 0;
  }

  const newDue = round2(totalDue - round2(Number(amount)));
  return ok({ balanceDue: Math.max(0, newDue) }, "Payment recorded");
}

function daysBetween(a, b) {
  const ms = new Date(b + "T00:00:00") - new Date(a + "T00:00:00");
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

export const POST = withErrorHandler(handler);