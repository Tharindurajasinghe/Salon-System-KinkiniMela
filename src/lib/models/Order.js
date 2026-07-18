import mongoose from "mongoose";

/**
 * Product pre-order (pickup only, no delivery, no payment).
 * Created from the customer Product page checkout.
 */
const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true }, // ORD000001
    items: [
      {
        productRef: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        sellingPrice: Number,
        qty: Number,
      },
    ],
    customer: {
      firstName: String,
      lastName: String,
      phone: { type: String, required: true },
    },
    pickupDate: { type: String, required: true }, // "yyyy-MM-dd"
    status: {
      type: String,
      enum: ["pending", "confirm", "rejected"],
      default: "pending",
    },
    rejectReason: { type: String, default: "" },
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
