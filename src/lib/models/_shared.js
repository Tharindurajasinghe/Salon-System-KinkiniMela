import mongoose from "mongoose";

/**
 * Optional discount attached to a product/service/package.
 * When present, the card shows a big percentage label + a small note.
 */
export const DiscountSchema = new mongoose.Schema(
  {
    percentage: { type: Number, default: 0 }, // 0 = no discount
    note: { type: String, default: "" },
  },
  { _id: false }
);

/** A stored image reference (Cloudinary). */
export const ImageSchema = new mongoose.Schema(
  { url: String, publicId: String },
  { _id: false }
);
