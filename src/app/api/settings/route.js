import connectDB from "@/lib/db";
import Settings from "@/lib/models/Settings";
import { getSettings } from "@/lib/settings";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

// Fields a client is allowed to update (whitelist — never trust the raw body).
const EDITABLE = [
  "salonName", "tagline", "phone", "whatsapp", "email", "adminSmsPhone",
  "addressLine1", "addressLine2", "locationUrl", "logo",
  "howToGetService", "contactMessage",
];

/**
 * GET /api/settings
 * Returns salon settings + read-only integration status (booleans only, never
 * the secret values). Any logged-in staff member may read.
 */
async function getHandler() {
  const { session, error } = requireAuth();
  if (error) return fail(error, 401);

  const settings = await getSettings();
  return ok({
    settings,
    integrations: {
      smsConfigured: Boolean(process.env.SMS_API_KEY && process.env.SMS_API_URL),
      cloudinaryConfigured: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY
      ),
    },
  });
}

/** PUT /api/settings — admin only. Updates the whitelisted salon-info fields. */
async function putHandler(req) {
  const { error } = requireAdmin();
  if (error) return fail(error, 403);

  await connectDB();
  const body = await req.json();

  const update = {};
  for (const key of EDITABLE) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const settings = await Settings.findOneAndUpdate(
    { key: "main" },
    { $set: update },
    { new: true, upsert: true }
  ).lean();

  return ok(settings, "Settings saved");
}

export const GET = withErrorHandler(getHandler);
export const PUT = withErrorHandler(putHandler);
