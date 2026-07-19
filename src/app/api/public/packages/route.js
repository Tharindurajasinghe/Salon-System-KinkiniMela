import connectDB from "@/lib/db";
import Package from "@/lib/models/Package";
import { ok, withErrorHandler } from "@/lib/utils/apiResponse";

/** GET /api/public/packages?q= — public (no profit). */
async function handler(req) {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const query = { active: true };
  if (sp.get("q")) query.name = { $regex: sp.get("q"), $options: "i" };

  const packages = await Package.find(query).select("-cost").sort({ createdAt: -1 }).lean();
  return ok(packages);
}
export const GET = withErrorHandler(handler);
