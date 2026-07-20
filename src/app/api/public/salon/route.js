import { getSettings } from "@/lib/settings";
import { ok, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * GET /api/public/salon
 * Public, non-secret salon identity for pre-auth screens (login) and any
 * client component that needs the brand. Never exposes integration keys.
 */
async function handler() {
  const s = await getSettings();
  return ok({
    salonName: s.salonName,
    tagline: s.tagline,
    logo: s.logo || null,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    addressLine1: s.addressLine1,
    addressLine2: s.addressLine2,
    locationUrl: s.locationUrl,
    howToGetService: s.howToGetService || { en: "", si: "" },
    contactMessage: s.contactMessage || { en: "", si: "" },
  });
}
export const dynamic = "force-dynamic";
export const GET = withErrorHandler(handler);
