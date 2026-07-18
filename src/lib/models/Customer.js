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
  },
  { timestamps: true }
);

// Searchable by ID card number (in addition to name / phone).
CustomerSchema.index({ idCard: 1 });

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
