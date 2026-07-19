import mongoose from "mongoose";
import { ImageSchema } from "./_shared";

/**
 * A supplier / purchase invoice the salon records for its own bookkeeping
 * (separate from customer POS bills). Balance due = totalAmount - paidAmount;
 * status is "paid" once fully paid, otherwise "balance_due".
 */
const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, unique: true }, // INV000001
    companyName: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // yyyy-MM-dd

    paymentMethod: { type: String, enum: ["cash", "cheque", "bank_transfer"], default: "cash" },
    chequeDate: { type: String, default: "" }, // only for cheque (optional)
    chequeNumber: { type: String, default: "" }, // only for cheque (optional)

    images: { type: [ImageSchema], default: [] }, // up to 5 (enforced in route)

    note: { type: String, default: "" },

    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 }, // running total of payments
    // Payment ledger — first entry is the initial installment.
    payments: [
      {
        amount: { type: Number, required: true },
        at: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
