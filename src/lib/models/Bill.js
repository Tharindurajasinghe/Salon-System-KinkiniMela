import mongoose from "mongoose";

/**
 * A completed POS sale made by admin or cashier.
 * Bills always have status "paid". They feed the daily/monthly summaries.
 * Line items can be products, services or packages.
 */
const BillSchema = new mongoose.Schema(
  {
    billId: { type: String, unique: true }, // BILL000001
    items: [
      {
        kind: { type: String, enum: ["product", "service", "package"] },
        ref: { type: mongoose.Schema.Types.ObjectId },
        name: String,
        sellingPrice: Number, // unit selling price
        cost: Number, // unit cost (buying price / (price-profit))
        qty: Number,
        // Post-discount breakdown (from discount.js) stored for the summary.
        itemDiscount: Number,
        profitAfter: Number,
      },
    ],
    customerName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },

    subTotal: { type: Number, default: 0 }, // before discount
    discount: {
      type: { type: String, enum: ["percentage", "amount"], default: "amount" },
      value: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }, // resolved LKR discount
    },
    grandTotal: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },

    cashPaid: { type: Number, default: 0 },
    change: { type: Number, default: 0 },

    // --- Customer credit / installments ---
    // When a bill is put "on account", it is linked to a registered customer and
    // may be paid off over time. `paidAmount` is the running total across
    // `payments`; balance due = grandTotal - paidAmount.
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    isCredit: { type: Boolean, default: false },
    paidAmount: { type: Number, default: 0 },
    payments: [
      {
        amount: { type: Number, required: true },
        at: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],

    status: { type: String, default: "paid" }, // "paid" | "credit"
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Bill || mongoose.model("Bill", BillSchema);
