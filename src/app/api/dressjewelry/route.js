import connectDB from "@/lib/db";
import DressJewelry from "@/lib/models/DressJewelry";
import { requireAuth, canAccess } from "@/lib/auth";
import { nextId } from "@/lib/utils/idGenerator";
import { cloudinaryService } from "@/lib/services/CloudinaryService";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";
import Category from "@/lib/models/Category";

// Dress & jewelry lives under the "Our Services" page (key: services).
function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "services")) return { error: "Not allowed", status: 403 };
  return { session };
}

/** GET /api/dressjewelry?q=&categoryId=&activeOnly= */
async function getHandler(req) {
  const { error } = requireAuth();
  if (error) return fail(error, 401);
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const query = {};
  if (sp.get("q")) query.name = { $regex: sp.get("q"), $options: "i" };
  if (sp.get("categoryId")) query.category = sp.get("categoryId");
  if (sp.get("activeOnly") === "1") query.active = true;

  const items = await DressJewelry.find(query).populate("category", "name").sort({ createdAt: -1 }).lean();
  return ok(items);
}

function cleanVariants(list, isDress) {
  return (Array.isArray(list) ? list : [])
    .filter((v) => v && v.name?.trim())
    .map((v) => ({
      name: v.name.trim(),
      cost: Number(v.cost || 0),
      sellingPrice: Number(v.sellingPrice || 0),
      stock: Number(v.stock || 0),
      fit1: isDress ? Number(v.fit1 || 0) : 0,
      fit2: isDress ? Number(v.fit2 || 0) : 0,
      fit3: isDress ? Number(v.fit3 || 0) : 0,
    }));
}

/** POST /api/dressjewelry — create. */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const b = await req.json();
  if (!b.name?.trim()) return fail("Name is required", 400);
  const isDress = Boolean(b.isDress);
  const variants = cleanVariants(b.variants, isDress);
  if (variants.length === 0) return fail("Add at least one variant", 400);
  for (const v of variants) if (v.sellingPrice < v.cost) return fail(`Variant "${v.name}" selling price is below cost`, 400);

  const code = await nextId("DRJ");
  const item = await DressJewelry.create({
    code,
    name: b.name.trim(),
    category: b.category || null,
    images: Array.isArray(b.images) ? b.images.slice(0, 5) : [],
    description: b.description || "",
    delayChargePerDay: Number(b.delayChargePerDay || 0),
    isDress,
    variants,
    active: b.active !== false,
  });
  return created(item, "Item added");
}

/** PUT /api/dressjewelry — update by { id, ...fields } */
async function putHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { id, ...fields } = await req.json();
  if (!id) return fail("id is required", 400);

  if (fields.variants) fields.variants = cleanVariants(fields.variants, Boolean(fields.isDress));
  if (fields.delayChargePerDay != null) fields.delayChargePerDay = Number(fields.delayChargePerDay);

  if (Array.isArray(fields.images)) {
    fields.images = fields.images.slice(0, 5);
    // Destroy any Cloudinary images dropped in this edit.
    const prev = await DressJewelry.findById(id).select("images").lean();
    const keep = new Set(fields.images.map((i) => i.publicId));
    (prev?.images || []).forEach((img) => {
      if (img.publicId && !keep.has(img.publicId)) cloudinaryService.destroy(img.publicId).catch(() => {});
    });
  }

  const item = await DressJewelry.findByIdAndUpdate(id, { $set: fields }, { new: true }).populate("category", "name").lean();
  if (!item) return fail("Item not found", 404);
  return ok(item, "Item updated");
}

/** DELETE /api/dressjewelry?id=... */
async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("id is required", 400);
  const item = await DressJewelry.findById(id).select("images").lean();
  (item?.images || []).forEach((img) => { if (img.publicId) cloudinaryService.destroy(img.publicId).catch(() => {}); });
  await DressJewelry.findByIdAndDelete(id);
  return ok(null, "Item removed");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
