import mongoose from "mongoose";
import { DiscountSchema, ImageSchema } from "./_shared";

const ProductSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true }, // auto-generated (e.g. PRD000001)
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    buyingPrice: { type: Number, required: true }, // cost - for profit calc
    sellingPrice: { type: Number, required: true },
    image: ImageSchema,
    stock: { type: Number, default: 0 },
    description: { type: String, default: "" },
    discount: { type: DiscountSchema, default: () => ({}) },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
