import connectDB from "@/lib/db";
import Category from "@/lib/models/Category";
import { requireAuth, canAccess } from "@/lib/auth";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

// Guard: must be logged in AND allowed on the Categories page.
function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "categories")) return { error: "Not allowed", status: 403 };
  return { session };
}

/** GET /api/categories?type=product|service — list categories. */
async function getHandler(req) {
  await connectDB();
  const type = new URL(req.url).searchParams.get("type");
  const query = type ? { type } : {};
  const categories = await Category.find(query).sort({ name: 1 }).lean();
  return ok(categories);
}

/** POST /api/categories — { name, type } */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { name, type } = await req.json();
  if (!name?.trim()) return fail("Category name is required", 400);
  if (!["product", "service", "dressjewelry"].includes(type)) return fail("Invalid category type", 400);

  const exists = await Category.findOne({ name: name.trim(), type });
  if (exists) return fail("That category already exists", 409);

  const cat = await Category.create({ name: name.trim(), type });
  return created(cat, "Category added");
}

/** PUT /api/categories — { id, name } */
async function putHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { id, name } = await req.json();
  if (!id || !name?.trim()) return fail("id and name are required", 400);

  const cat = await Category.findByIdAndUpdate(
    id,
    { $set: { name: name.trim() } },
    { new: true }
  ).lean();
  if (!cat) return fail("Category not found", 404);
  return ok(cat, "Category updated");
}

/** DELETE /api/categories?id=... */
async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("id is required", 400);
  await Category.findByIdAndDelete(id);
  return ok(null, "Category removed");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
