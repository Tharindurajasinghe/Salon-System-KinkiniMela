import connectDB from "@/lib/db";
import Customer from "@/lib/models/Customer";
import { requireAuth, canAccess } from "@/lib/auth";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * GET /api/billing/customers?q= — minimal customer search for the billing
 * "Add to customer" picker (by name or phone). Available to billing users even
 * if they don't have full Customers-page access.
 */
async function handler(req) {
  const { session, error } = requireAuth();
  if (error) return fail(error, 401);
  if (!canAccess(session, "billing")) return fail("Not allowed", 403);
  await connectDB();

  const q = new URL(req.url).searchParams.get("q");
  if (!q || q.trim().length < 1) return ok([]);

  const customers = await Customer.find({
    $or: [{ name: { $regex: q, $options: "i" } }, { phone: { $regex: q, $options: "i" } }],
  }).select("name phone idCard").limit(15).lean();

  return ok(customers);
}
export const GET = withErrorHandler(handler);
