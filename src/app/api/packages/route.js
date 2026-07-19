import connectDB from "@/lib/db";
import Package from "@/lib/models/Package";
import { requireAuth, canAccess } from "@/lib/auth";
import { nextId } from "@/lib/utils/idGenerator";
import { cloudinaryService } from "@/lib/services/CloudinaryService";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "services")) return { error: "Not allowed", status: 403 };
  return { session };
}

/** GET /api/packages?q=&activeOnly= */
async function getHandler(req) {
  const { error } = requireAuth();
  if (error) return fail(error, 401);
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const query = {};
  if (sp.get("q")) query.name = { $regex: sp.get("q"), $options: "i" };
  if (sp.get("activeOnly") === "1") query.active = true;

  const packages = await Package.find(query).sort({ createdAt: -1 }).lean();
  return ok(packages);
}

/** POST /api/packages — create (auto id PKG######, max 3 images). */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const b = await req.json();
  if (!b.name?.trim()) return fail("Name is required", 400);
  if (b.sellingPrice == null) return fail("Selling price is required", 400);
  if (Number(b.sellingPrice) < Number(b.cost || 0)) return fail("Selling price cannot be below cost", 400);

  const images = Array.isArray(b.images) ? b.images.slice(0, 3) : [];
  const code = await nextId("PKG");
  const pkg = await Package.create({
    code,
    name: b.name.trim(),
    cost: Number(b.cost || 0),
    sellingPrice: Number(b.sellingPrice),
    consultationNeeded: Boolean(b.consultationNeeded),
    images,
    timeSlots: Array.isArray(b.timeSlots) ? b.timeSlots : [],
    maxBookings: Math.max(1, Number(b.maxBookings || 1)),
    timeSpendMin: Number(b.timeSpendMin || 60),
    description: b.description || "",
    discount: b.discount || {},
    active: b.active !== false,
  });
  return created(pkg, "Package added");
}

async function putHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { id, ...fields } = await req.json();
  if (!id) return fail("id is required", 400);
  if (Array.isArray(fields.images)) fields.images = fields.images.slice(0, 3);

  const pkg = await Package.findByIdAndUpdate(id, { $set: fields }, { new: true }).lean();
  if (!pkg) return fail("Package not found", 404);
  return ok(pkg, "Package updated");
}

async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("id is required", 400);

  const pkg = await Package.findById(id).select("images").lean();
  (pkg?.images || []).forEach((img) => {
    if (img.publicId) cloudinaryService.destroy(img.publicId).catch(() => {});
  });
  await Package.findByIdAndDelete(id);
  return ok(null, "Package removed");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
