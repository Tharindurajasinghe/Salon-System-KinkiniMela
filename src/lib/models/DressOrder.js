import mongoose from "mongoose";

/**
 * A customer rental request for a dress/jewelry item made from the website.
 * The item is reserved for the [bringDate, deliverDate] window; availability
 * checks count overlapping active reservations against variant stock.
 */
const DressOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true }, // DOR000001
    itemRef: { type: mongoose.Schema.Types.ObjectId, ref: "DressJewelry" },
    itemName: { type: String },
    variantName: { type: String },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    delayChargePerDay: { type: Number, default: 0 }, // snapshot

    customer: {
      firstName: String,
      lastName: String,
      phone: { type: String, required: true },
    },

    bringDate: { type: String, required: true }, // yyyy-MM-dd (pickup)
    deliverDate: { type: String, required: true }, // yyyy-MM-dd (return)

    status: { type: String, enum: ["pending", "confirm", "rejected"], default: "pending" },
    rejectReason: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.DressOrder || mongoose.model("DressOrder", DressOrderSchema);
