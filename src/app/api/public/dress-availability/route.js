import connectDB from "@/lib/db";
import { variantAvailability } from "@/lib/dressAvailability";
import { todaySLKey, dateKey } from "@/lib/utils/timezone";
import { ok, fail, withErrorHandler } from "@/lib/utils/apiResponse";

/**
 * GET /api/public/dress-availability?itemId=&variant=&bring=&deliver=
 * Returns how many units are free for that window (past/today bring blocked,
 * and deliver must be on/after bring).
 */
async function handler(req) {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const itemId = sp.get("itemId");
  const variant = sp.get("variant");
  const bring = sp.get("bring");
  const deliver = sp.get("deliver");

  if (!itemId || !variant || !bring || !deliver) return fail("Missing parameters", 400);
  if (dateKey(bring) <= todaySLKey()) return ok({ available: 0, stock: 0, reason: "past_or_today" });
  if (dateKey(deliver) < dateKey(bring)) return ok({ available: 0, stock: 0, reason: "bad_range" });

  const res = await variantAvailability(itemId, variant, dateKey(bring), dateKey(deliver));
  return ok(res);
}
export const GET = withErrorHandler(handler);
