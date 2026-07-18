import connectDB from "@/lib/db";
import Product from "@/lib/models/Product";
import { requireAuth, canAccess } from "@/lib/auth";
import { nextId } from "@/lib/utils/idGenerator";
import { cloudinaryService } from "@/lib/services/CloudinaryService";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

// Products/Services/Packages all live under the "Our Services" page (key: services).
function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "services")) return { error: "Not allowed", status: 403 };
  return { session };
}

/** GET /api/products?q=&categoryId=&activeOnly= */
async function getHandler(req) {
  const { error } = requireAuth();
  if (error) return fail(error, 401);
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const query = {};
  if (sp.get("q")) query.name = { $regex: sp.get("q"), $options: "i" };
  if (sp.get("categoryId")) query.category = sp.get("categoryId");
  if (sp.get("activeOnly") === "1") query.active = true;

  const products = await Product.find(query)
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .lean();
  return ok(products);
}

/** POST /api/products — create a product (auto id PRD######). */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const b = await req.json();
  if (!b.name?.trim()) return fail("Name is required", 400);
  if (b.buyingPrice == null || b.sellingPrice == null)
    return fail("Buying and selling prices are required", 400);

  const code = await nextId("PRD");
  const product = await Product.create({
    code,
    name: b.name.trim(),
    category: b.category || null,
    buyingPrice: Number(b.buyingPrice),
    sellingPrice: Number(b.sellingPrice),
    image: b.image || null,
    stock: Number(b.stock || 0),
    description: b.description || "",
    discount: b.discount || {},
    active: b.active !== false,
  });
  return created(product, "Product added");
}

/** PUT /api/products — update by { id, ...fields }. */
async function putHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { id, ...fields } = await req.json();
  if (!id) return fail("id is required", 400);

  // If the image is being replaced, clean up the old Cloudinary asset.
  if (fields.image) {
    const prev = await Product.findById(id).select("image").lean();
    if (prev?.image?.publicId && prev.image.publicId !== fields.image.publicId) {
      cloudinaryService.destroy(prev.image.publicId).catch(() => {});
    }
  }

  const product = await Product.findByIdAndUpdate(id, { $set: fields }, { new: true })
    .populate("category", "name")
    .lean();
  if (!product) return fail("Product not found", 404);
  return ok(product, "Product updated");
}

/** DELETE /api/products?id=... */
async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("id is required", 400);

  const product = await Product.findById(id).select("image").lean();
  if (product?.image?.publicId) cloudinaryService.destroy(product.image.publicId).catch(() => {});
  await Product.findByIdAndDelete(id);
  return ok(null, "Product removed");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
