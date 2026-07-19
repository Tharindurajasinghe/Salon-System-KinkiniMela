import connectDB from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import { requireAuth, canAccess } from "@/lib/auth";
import { nextId } from "@/lib/utils/idGenerator";
import { cloudinaryService } from "@/lib/services/CloudinaryService";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "invoices")) return { error: "Not allowed", status: 403 };
  return { session };
}

// Attach computed balance + status to an invoice document.
function decorate(inv) {
  const balance = Math.round((inv.totalAmount - inv.paidAmount) * 100) / 100;
  return { ...inv, balance, status: balance <= 0 ? "paid" : "balance_due" };
}

function cleanCheque(method, b) {
  return method === "cheque"
    ? { chequeDate: b.chequeDate || "", chequeNumber: b.chequeNumber || "" }
    : { chequeDate: "", chequeNumber: "" };
}

/**
 * GET /api/invoices?q=&date=&status=paid|balance_due
 * Search by invoice number or company name; filter by exact date and status.
 */
async function getHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const sp = new URL(req.url).searchParams;
  const q = sp.get("q");
  const date = sp.get("date");
  const status = sp.get("status");

  const query = {};
  if (date) query.date = date;
  if (q) query.$or = [{ invoiceNo: { $regex: q, $options: "i" } }, { companyName: { $regex: q, $options: "i" } }];
  if (status === "paid") query.$expr = { $gte: ["$paidAmount", "$totalAmount"] };
  else if (status === "balance_due") query.$expr = { $lt: ["$paidAmount", "$totalAmount"] };

  const invoices = await Invoice.find(query).sort({ createdAt: -1 }).limit(500).lean();
  return ok(invoices.map(decorate));
}

/** POST /api/invoices — create. */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const b = await req.json();
  if (!b.companyName?.trim()) return fail("Company name is required", 400);
  if (!b.date) return fail("Date is required", 400);
  const method = ["cash", "cheque", "bank_transfer"].includes(b.paymentMethod) ? b.paymentMethod : "cash";
  const total = Math.max(0, Number(b.totalAmount || 0));
  const paid = Math.min(total, Math.max(0, Number(b.firstInstallment || 0)));

  const invoiceNo = await nextId("INV");
  const payments = paid > 0 ? [{ amount: paid, note: "1st installment" }] : [];
  const invoice = await Invoice.create({
    invoiceNo,
    companyName: b.companyName.trim(),
    date: b.date,
    paymentMethod: method,
    ...cleanCheque(method, b),
    images: Array.isArray(b.images) ? b.images.slice(0, 5) : [],
    note: b.note || "",
    totalAmount: total,
    paidAmount: paid,
    payments,
  });
  return created(decorate(invoice.toObject()), "Invoice added");
}

/** PUT /api/invoices — update by { id, ...fields }. */
async function putHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { id, ...b } = await req.json();
  if (!id) return fail("id is required", 400);

  const update = {};
  if (b.companyName !== undefined) update.companyName = b.companyName.trim();
  if (b.date !== undefined) update.date = b.date;
  if (b.note !== undefined) update.note = b.note;
  if (b.paymentMethod !== undefined) {
    const method = ["cash", "cheque", "bank_transfer"].includes(b.paymentMethod) ? b.paymentMethod : "cash";
    update.paymentMethod = method;
    Object.assign(update, cleanCheque(method, b));
  }
  if (b.totalAmount !== undefined) update.totalAmount = Math.max(0, Number(b.totalAmount));

  if (b.images !== undefined) {
    update.images = Array.isArray(b.images) ? b.images.slice(0, 5) : [];
    // Remove any Cloudinary images that were dropped in the edit.
    const prev = await Invoice.findById(id).select("images").lean();
    const keptIds = new Set(update.images.map((i) => i.publicId));
    (prev?.images || []).forEach((img) => {
      if (img.publicId && !keptIds.has(img.publicId)) cloudinaryService.destroy(img.publicId).catch(() => {});
    });
  }

  const invoice = await Invoice.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!invoice) return fail("Invoice not found", 404);
  return ok(decorate(invoice), "Invoice updated");
}

/** DELETE /api/invoices?id=... */
async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("id is required", 400);
  const inv = await Invoice.findById(id).select("images").lean();
  (inv?.images || []).forEach((img) => { if (img.publicId) cloudinaryService.destroy(img.publicId).catch(() => {}); });
  await Invoice.findByIdAndDelete(id);
  return ok(null, "Invoice removed");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
