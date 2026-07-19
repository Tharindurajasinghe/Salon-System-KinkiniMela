import connectDB from "@/lib/db";
import QuickSale from "@/lib/models/QuickSale";
import { requireAuth, canAccess } from "@/lib/auth";
import { resolveItem } from "@/lib/catalogueResolve";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

const MAX_QUICK = 12;

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "billing")) return { error: "Not allowed", status: 403 };
  return { session };
}

/** GET /api/quicksale — resolved quick-sale items (skips deleted/inactive). */
async function getHandler() {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const entries = await QuickSale.find().sort({ createdAt: 1 }).lean();
  const items = [];
  for (const e of entries) {
    const info = await resolveItem(e.kind, e.refId);
    if (info && info.active) {
      items.push({ _id: e._id, kind: e.kind, refId: e.refId, name: info.name, sellingPrice: info.sellingPrice, cost: info.cost, image: info.image });
    }
  }
  return ok(items);
}

/** POST /api/quicksale — { kind, refId } (max 12). */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { kind, refId } = await req.json();
  if (!["product", "service", "package"].includes(kind) || !refId)
    return fail("kind and refId are required", 400);

  const count = await QuickSale.countDocuments();
  if (count >= MAX_QUICK) return fail(`Quick sale is full (max ${MAX_QUICK}).`, 400);

  const exists = await QuickSale.findOne({ kind, refId });
  if (exists) return fail("Already in quick sale", 409);

  const entry = await QuickSale.create({ kind, refId });
  return created(entry, "Added to quick sale");
}

/** DELETE /api/quicksale?id=... */
async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("id is required", 400);
  await QuickSale.findByIdAndDelete(id);
  return ok(null, "Removed from quick sale");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const DELETE = withErrorHandler(deleteHandler);
