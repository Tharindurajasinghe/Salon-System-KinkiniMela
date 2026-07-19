import connectDB from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import { requireAuth, canAccess } from "@/lib/auth";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * POST /api/invoices/payment — record a payment against an invoice's balance.
 * Body: { invoiceId, amount, note? }
 */
async function handler(req) {
  const { session, error } = requireAuth();
  if (error) return fail(error, 401);
  if (!canAccess(session, "invoices")) return fail("Not allowed", 403);
  await connectDB();

  const { invoiceId, amount, note } = await req.json();
  const amt = Math.round(Number(amount) * 100) / 100;
  if (!invoiceId) return fail("invoiceId is required", 400);
  if (!amt || amt <= 0) return fail("Enter a valid amount", 400);

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return fail("Invoice not found", 404);

  const balance = invoice.totalAmount - invoice.paidAmount;
  if (amt > balance + 0.0001) return fail("Amount exceeds the balance due", 400);

  invoice.payments.push({ amount: amt, note: note || "Payment" });
  invoice.paidAmount = Math.round((invoice.paidAmount + amt) * 100) / 100;
  await invoice.save();

  const obj = invoice.toObject();
  const newBalance = Math.round((obj.totalAmount - obj.paidAmount) * 100) / 100;
  return ok({ ...obj, balance: newBalance, status: newBalance <= 0 ? "paid" : "balance_due" }, "Payment recorded");
}

export const POST = withErrorHandler(handler);
