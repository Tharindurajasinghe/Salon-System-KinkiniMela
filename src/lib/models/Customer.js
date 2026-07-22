import mongoose from "mongoose";

/**
 * Customers are now registered manually by admin/cashier staff (they are no
 * longer auto-created from orders/bookings). A customer can carry credit — see
 * the Bill model's `isCredit` / `paidAmount` / `payments` fields — and their
 * outstanding balance is computed from those bills.
 */
const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    phone: { type: String, required: true, unique: true, trim: true },
    idCard: { type: String, default: "", trim: true }, // national ID card number

    // Payments recorded against dress/jewelry late-return (delay) charges.
    // Delay charges are computed on the fly from bills; these entries record
    // how much of that delay has been settled, so it stops showing as owed.
    delayPayments: [
      {
        amount: { type: Number, required: true },
        at: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

// Searchable by ID card number (in addition to name / phone).
CustomerSchema.index({ idCard: 1 });

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);