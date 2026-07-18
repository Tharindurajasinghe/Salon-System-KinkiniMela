import connectDB from "@/lib/db";
import Settings from "@/lib/models/Settings";

/**
 * Returns the single global Settings document, creating a default one on first
 * run. Used by the navbar, footer, printed bills and anywhere salon identity
 * is needed — so salon info is defined in ONE place (Settings page).
 */
export async function getSettings() {
  await connectDB();
  let settings = await Settings.findOne({ key: "main" }).lean();
  if (!settings) {
    settings = (await Settings.create({ key: "main" })).toObject();
  }
  return settings;
}
