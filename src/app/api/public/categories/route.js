import connectDB from "@/lib/db";
import Category from "@/lib/models/Category";
import { ok, withErrorHandler } from "@/lib/utils/apiResponse";

/** GET /api/public/categories?type=product|service */
async function handler(req) {
  await connectDB();
  const type = new URL(req.url).searchParams.get("type");
  const query = type ? { type } : {};
  const cats = await Category.find(query).sort({ name: 1 }).lean();
  return ok(cats);
}
export const GET = withErrorHandler(handler);
