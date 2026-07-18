import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Customer from "@/lib/models/Customer";
import Bill from "@/lib/models/Bill";
import { requireAuth, canAccess } from "@/lib/auth";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "customers")) return { error: "Not allowed", status: 403 };
  return { session };
}

// Sum outstanding balance (grandTotal - paidAmount) for a set of customers.
// Aggregation does NOT auto-cast, so string ids are converted to ObjectId here.
async function balancesFor(customerIds) {
  if (customerIds.length === 0) return {};
  const ids = customerIds.map((x) => (typeof x === "string" ? new mongoose.Types.ObjectId(x) : x));
  const rows = await Bill.aggregate([
    { $match: { customer: { $in: ids }, isCredit: true } },
    { $group: { _id: "$customer", balance: { $sum: { $subtract: ["$grandTotal", "$paidAmount"] } } } },
  ]);
  const map = {};
  rows.forEach((r) => { map[String(r._id)] = Math.round(r.balance * 100) / 100; });
  return map;
}

/**
 * GET /api/admin/customers            -> list (with balance), search by name/phone/idCard
 * GET /api/admin/customers?id=<id>    -> one customer + credit bills + payment history
 */
async function getHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const sp = new URL(req.url).searchParams;
  const id = sp.get("id");

  // ---- Single customer detail ----
  if (id) {
    const customer = await Customer.findById(id).lean();
    if (!customer) return fail("Customer not found", 404);

    const bills = await Bill.find({ customer: id, isCredit: true }).sort({ createdAt: -1 }).lean();

    const creditBills = bills.map((b) => ({
      _id: b._id,
      billId: b.billId,
      subTotal: b.subTotal,
      discount: b.discount,
      grandTotal: b.grandTotal,
      paidAmount: b.paidAmount,
      balance: Math.round((b.grandTotal - b.paidAmount) * 100) / 100,
      status: b.status,
      createdAt: b.createdAt,
      items: b.items,
    }));

    // Flatten every installment across the customer's bills into one history.
    const history = [];
    bills.forEach((b) =>
      (b.payments || []).forEach((p) =>
        history.push({ billId: b.billId, amount: p.amount, at: p.at, note: p.note })
      )
    );
    history.sort((a, b) => new Date(b.at) - new Date(a.at));

    const balanceDue = Math.round(creditBills.reduce((s, b) => s + b.balance, 0) * 100) / 100;

    return ok({ customer, creditBills, history, balanceDue });
  }

  // ---- List / search ----
  const q = sp.get("q");
  const query = q
    ? { $or: [
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { idCard: { $regex: q, $options: "i" } },
      ] }
    : {};

  const customers = await Customer.find(query).sort({ createdAt: -1 }).limit(500).lean();
  const balances = await balancesFor(customers.map((c) => c._id));
  const withBalance = customers.map((c) => ({ ...c, balanceDue: balances[String(c._id)] || 0 }));
  return ok(withBalance);
}

/** POST — create. Body: { name, addressLine1, addressLine2, phone, idCard } */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const b = await req.json();
  if (!b.name?.trim()) return fail("Name is required", 400);
  if (!b.phone?.trim()) return fail("Phone number is required", 400);

  const exists = await Customer.findOne({ phone: b.phone.trim() });
  if (exists) return fail("A customer with that phone already exists", 409);

  const customer = await Customer.create({
    name: b.name.trim(),
    addressLine1: b.addressLine1 || "",
    addressLine2: b.addressLine2 || "",
    phone: b.phone.trim(),
    idCard: (b.idCard || "").trim(),
  });
  return created(customer, "Customer added");
}

/** PUT — update. Body: { id, ...fields } */
async function putHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { id, name, addressLine1, addressLine2, phone, idCard } = await req.json();
  if (!id) return fail("id is required", 400);
  if (phone) {
    const clash = await Customer.findOne({ phone: phone.trim(), _id: { $ne: id } });
    if (clash) return fail("That phone number is already used by another customer", 409);
  }

  const update = {};
  if (name !== undefined) update.name = name.trim();
  if (addressLine1 !== undefined) update.addressLine1 = addressLine1;
  if (addressLine2 !== undefined) update.addressLine2 = addressLine2;
  if (phone !== undefined) update.phone = phone.trim();
  if (idCard !== undefined) update.idCard = idCard.trim();

  const customer = await Customer.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!customer) return fail("Customer not found", 404);
  return ok(customer, "Customer updated");
}

/** DELETE ?id= — blocked while the customer still owes a balance. */
async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("id is required", 400);

  const balances = await balancesFor([id]);
  if ((balances[id] || 0) > 0) return fail("This customer still has an outstanding balance", 400);

  await Customer.findByIdAndDelete(id);
  return ok(null, "Customer removed");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
