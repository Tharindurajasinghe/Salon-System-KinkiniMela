import mongoose from "mongoose";
import { ImageSchema } from "./_shared";

// Gallery photos (admin add/remove/update). Each has a name + image.
const GallerySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: ImageSchema,
  },
  { timestamps: true }
);

export default mongoose.models.Gallery || mongoose.model("Gallery", GallerySchema);
