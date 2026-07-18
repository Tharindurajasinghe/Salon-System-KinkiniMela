import { cloudinaryService } from "@/lib/services/CloudinaryService";
import { requireAuth } from "@/lib/auth";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * POST /api/upload
 * Body: { image: <base64 data URL>, folder?: string }
 * Uploads to Cloudinary and returns { url, publicId }. Staff only.
 * Reused by Settings (logo), Products, Services, Packages, Gallery.
 */
async function handler(req) {
  const { error } = requireAuth();
  if (error) return fail(error, 401);

  const { image, folder } = await req.json();
  if (!image) return fail("No image provided", 400);

  const result = await cloudinaryService.upload(image, folder || "salon");
  return ok(result, "Uploaded");
}

export const POST = withErrorHandler(handler);
