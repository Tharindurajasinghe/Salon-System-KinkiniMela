import mongoose from "mongoose";

/**
 * Quick-sale shortcuts shown first on the Billing screen (max 12).
 * Each entry just points at a product/service/package; the current name/price
 * are resolved live at read time so they never go stale.
 */
const QuickSaleSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["product", "service", "package"], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

QuickSaleSchema.index({ kind: 1, refId: 1 }, { unique: true });

export default mongoose.models.QuickSale || mongoose.model("QuickSale", QuickSaleSchema);
