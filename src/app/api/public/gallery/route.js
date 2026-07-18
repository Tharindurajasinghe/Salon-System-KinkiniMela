import connectDB from "@/lib/db";
import Gallery from "@/lib/models/Gallery";
import { ok, withErrorHandler } from "@/lib/utils/apiResponse";

/** GET /api/public/gallery — all gallery photos. */
async function handler() {
  await connectDB();
  const photos = await Gallery.find().sort({ createdAt: -1 }).lean();
  return ok(photos);
}
export const GET = withErrorHandler(handler);
