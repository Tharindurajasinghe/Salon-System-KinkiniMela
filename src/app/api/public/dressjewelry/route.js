import connectDB from "@/lib/db";
import DressJewelry from "@/lib/models/DressJewelry";
import { ok, withErrorHandler } from "@/lib/utils/apiResponse";
import Category from "@/lib/models/Category";

/** GET /api/public/dressjewelry?q=&categoryId= — active items, no cost/fit prices. */
async function handler(req) {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const query = { active: true };
  if (sp.get("q")) query.name = { $regex: sp.get("q"), $options: "i" };
  if (sp.get("categoryId")) query.category = sp.get("categoryId");

  const items = await DressJewelry.find(query).populate("category", "name").sort({ createdAt: -1 }).lean();

  // Only expose public-safe variant fields.
  const safe = items.map((it) => ({
    _id: it._id,
    code: it.code,
    name: it.name,
    category: it.category,
    image: it.image,
    description: it.description,
    delayChargePerDay: it.delayChargePerDay,
    isDress: it.isDress,
    variants: (it.variants || []).map((v) => ({ _id: v._id, name: v.name, sellingPrice: v.sellingPrice, stock: v.stock })),
  }));
  return ok(safe);
}
export const GET = withErrorHandler(handler);
