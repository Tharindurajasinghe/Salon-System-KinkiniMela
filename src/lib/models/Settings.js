import mongoose from "mongoose";

/**
 * Global salon settings. Stored as a single document (key: "main").
 * Used everywhere the salon identity is needed: navbar, footer, printed bills.
 * NOTE: secret integration keys (SMS/Cloudinary) live in .env, NOT here.
 */
const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    salonName: { type: String, default: "My Salon" },
    tagline: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    email: { type: String, default: "" },
    adminSmsPhone: { type: String, default: "" }, // where admin SMS alerts go
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    locationUrl: { type: String, default: "" }, // google maps url
    logo: { url: String, publicId: String },
    // Editable "How to get our service" section on the home page (bilingual).
    howToGetService: {
      en: { type: String, default: "" },
      si: { type: String, default: "" },
    },
    // Contact Us page admin message (bilingual).
    contactMessage: {
      en: { type: String, default: "" },
      si: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
