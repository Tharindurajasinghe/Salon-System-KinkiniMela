import mongoose from "mongoose";
import { DiscountSchema, ImageSchema } from "./_shared";

const ServiceSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true }, // e.g. SRV000001
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    cost: { type: Number, default: 0 }, // internal cost (never shown publicly)
    sellingPrice: { type: Number, required: true }, // shown as "starting from"
    consultationNeeded: { type: Boolean, default: false }, // price may change after consultation
    image: ImageSchema,
    description: { type: String, default: "" },
    discount: { type: DiscountSchema, default: () => ({}) },
    timeSpendMin: { type: Number, default: 30 }, // minutes
    timeSlots: { type: [String], default: [] }, // start times e.g. "10:00 AM"
    maxBookings: { type: Number, default: 1 }, // allowed bookings per same date + time slot
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Service || mongoose.model("Service", ServiceSchema);
