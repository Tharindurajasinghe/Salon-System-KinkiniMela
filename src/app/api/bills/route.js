import connectDB from "@/lib/db";
import Bill from "@/lib/models/Bill";
import Product from "@/lib/models/Product";
import Customer from "@/lib/models/Customer";
import { requireAuth, canAccess } from "@/lib/auth";
import { nextId } from "@/lib/utils/idGenerator";
import { resolveItem } from "@/lib/catalogueResolve";
import { applyBillDiscount } from "@/lib/utils/discount";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "billing")) return { error: "Not allowed", status: 403 };
  return { session };
}

/**
 * POST /api/bills — record a POS sale.
 * Body: { items: [{ kind, refId, qty }], customerName, customerPhone,
 *         discount: { type, value }, cashPaid }
 *
 * The server re-resolves every price/cost and recomputes all discount + profit
 * figures itself (never trusting client math) and decrements product stock.
 */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const body = await req.json();
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) return fail("Cart is empty", 400);

  // Resolve authoritative name/price/cost for each cart line.
  const resolved = [];
  for (const it of rawItems) {
    const qty = Math.max(1, Number(it.qty || 1));
    const info = await resolveItem(it.kind, it.refId);
    if (!info) return fail("One of the items no longer exists", 400);
    resolved.push({
      kind: it.kind,
      ref: it.refId,
      name: info.name,
      sellingPrice: info.sellingPrice,
      cost: info.cost,
      qty,
    });
  }

  // Apply the bill-level discount using the spec formulas.
  const discountType = body.discount?.type === "percentage" ? "percentage" : "amount";
  const discountValue = Math.max(0, Number(body.discount?.value || 0));
  const calc = applyBillDiscount(resolved, { type: discountType, value: discountValue });

  const totalProfit = calc.lines.reduce((s, l) => s + l.profitAfter, 0);

  // --- Credit vs. normal sale ---
  // If `customerId` is supplied, this bill goes "on account": it is linked to a
  // registered customer and may be paid off in installments. `firstInstallment`
  // is the amount paid now. Otherwise it's a normal fully-paid counter sale.
  const isCredit = Boolean(body.customerId);
  let customerId = null;
  let paidAmount;
  const payments = [];

  if (isCredit) {
    const customer = await Customer.findById(body.customerId).lean();
    if (!customer) return fail("Customer not found", 400);
    customerId = customer._id;
    const firstInstallment = clamp(Number(body.firstInstallment || 0), 0, calc.grandTotal);
    paidAmount = firstInstallment;
    if (firstInstallment > 0) payments.push({ amount: firstInstallment, note: "Initial installment" });
  } else {
    paidAmount = calc.grandTotal; // paid in full at the counter
  }

  const cashPaid = isCredit ? paidAmount : Math.max(0, Number(body.cashPaid || 0));
  const change = isCredit ? 0 : Math.max(0, Math.round((cashPaid - calc.grandTotal) * 100) / 100);
  const status = paidAmount >= calc.grandTotal ? "paid" : "credit";

  const billId = await nextId("BILL");
  const bill = await Bill.create({
    billId,
    items: calc.lines.map((l) => ({
      kind: l.kind,
      ref: l.ref,
      name: l.name,
      sellingPrice: l.sellingPrice,
      cost: l.cost,
      qty: l.qty,
      itemDiscount: l.itemDiscount,
      profitAfter: l.profitAfter,
    })),
    customerName: body.customerName || "",
    customerPhone: body.customerPhone || "",
    subTotal: calc.billTotalBefore,
    discount: { type: discountType, value: discountValue, amount: calc.totalDiscount },
    grandTotal: calc.grandTotal,
    totalProfit: Math.round(totalProfit * 100) / 100,
    cashPaid,
    change,
    customer: customerId,
    isCredit,
    paidAmount,
    payments,
    status,
    cashier: g.session.id,
  });

  // Decrement stock for product lines (services/packages have no stock).
  for (const line of resolved) {
    if (line.kind === "product") {
      await Product.findByIdAndUpdate(line.ref, { $inc: { stock: -line.qty } });
    }
  }

  return created(bill, "Bill saved");
}

// Clamp a number to [min, max].
function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

/** GET /api/bills?limit= — recent bills (for Orders/Summary). */
async function getHandler(req) {
  const { error } = requireAuth();
  if (error) return fail(error, 401);
  await connectDB();

  const limit = Math.min(200, Number(new URL(req.url).searchParams.get("limit") || 50));
  const bills = await Bill.find().sort({ createdAt: -1 }).limit(limit).lean();
  return ok(bills);
}

export const POST = withErrorHandler(postHandler);
export const GET = withErrorHandler(getHandler);
