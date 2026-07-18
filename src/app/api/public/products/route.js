import connectDB from "@/lib/db";
import Product from "@/lib/models/Product";
import { ok, withErrorHandler } from "@/lib/utils/apiResponse";

/** GET /api/public/products?q=&categoryId= — public catalogue (no cost/profit). */
async function handler(req) {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const query = { active: true };
  if (sp.get("q")) query.name = { $regex: sp.get("q"), $options: "i" };
  if (sp.get("categoryId")) query.category = sp.get("categoryId");

  const products = await Product.find(query)
    .select("-buyingPrice") // never expose cost to the public
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .lean();
  return ok(products);
}
export const GET = withErrorHandler(handler);
