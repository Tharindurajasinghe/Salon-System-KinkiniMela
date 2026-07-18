import mongoose from "mongoose";

// Categories are either for products or for services (name only).
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["product", "service"], required: true },
  },
  { timestamps: true }
);

CategorySchema.index({ name: 1, type: 1 }, { unique: true });

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
