import mongoose from "mongoose";
import { ImageSchema } from "./_shared";

/**
 * A dress or jewelry item that is rented/sold with multiple variants.
 * `isDress` unlocks the three fit-on prices on each variant.
 * `delayChargePerDay` is charged per day the item is returned late.
 */
const VariantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cost: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    stock: { type: Number, default: 0 }, // number of physical items available
    // Fit-on prices (only meaningful when the parent item isDress).
    fit1: { type: Number, default: 0 },
    fit2: { type: Number, default: 0 },
    fit3: { type: Number, default: 0 },
  },
  { _id: true }
);

const DressJewelrySchema = new mongoose.Schema(
  {
    code: { type: String, unique: true }, // e.g. DRJ000001
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    image: ImageSchema,
    description: { type: String, default: "" },
    delayChargePerDay: { type: Number, default: 0 },
    isDress: { type: Boolean, default: false },
    variants: { type: [VariantSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.DressJewelry || mongoose.model("DressJewelry", DressJewelrySchema);
