import mongoose from "mongoose";
import { DiscountSchema, ImageSchema } from "./_shared";

const ServiceSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true }, // e.g. SRV000001
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    price: { type: Number, required: true },
    profit: { type: Number, default: 0 }, // profit per service (spec)
    image: ImageSchema,
    description: { type: String, default: "" },
    discount: { type: DiscountSchema, default: () => ({}) },
    timeSpendMin: { type: Number, default: 30 }, // minutes
    timeSlots: { type: [String], default: [] }, // start times e.g. "10:00 AM"
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Service || mongoose.model("Service", ServiceSchema);
