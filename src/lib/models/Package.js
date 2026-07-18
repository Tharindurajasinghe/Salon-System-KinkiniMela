import mongoose from "mongoose";
import { DiscountSchema, ImageSchema } from "./_shared";

const PackageSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true }, // e.g. PKG000001
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    profit: { type: Number, default: 0 },
    images: { type: [ImageSchema], default: [] }, // max 3 (enforced in route)
    timeSlots: { type: [String], default: [] },
    timeSpendMin: { type: Number, default: 60 },
    description: { type: String, default: "" },
    discount: { type: DiscountSchema, default: () => ({}) },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Package || mongoose.model("Package", PackageSchema);
