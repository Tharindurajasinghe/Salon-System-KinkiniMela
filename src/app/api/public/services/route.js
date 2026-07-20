import connectDB from "@/lib/db";
import Service from "@/lib/models/Service";
import { ok, withErrorHandler } from "@/lib/utils/apiResponse";
import Category from "@/lib/models/Category";

/** GET /api/public/services?q=&categoryId= — public (no profit). */
async function handler(req) {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const query = { active: true };
  if (sp.get("q")) query.name = { $regex: sp.get("q"), $options: "i" };
  if (sp.get("categoryId")) query.category = sp.get("categoryId");

  const services = await Service.find(query)
    .select("-cost")
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .lean();
  return ok(services);
}
export const GET = withErrorHandler(handler);
