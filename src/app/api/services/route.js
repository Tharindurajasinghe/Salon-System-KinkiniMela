import connectDB from "@/lib/db";
import Service from "@/lib/models/Service";
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

/** GET /api/services?q=&categoryId=&activeOnly= */
async function getHandler(req) {
  const { error } = requireAuth();
  if (error) return fail(error, 401);
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const query = {};
  if (sp.get("q")) query.name = { $regex: sp.get("q"), $options: "i" };
  if (sp.get("categoryId")) query.category = sp.get("categoryId");
  if (sp.get("activeOnly") === "1") query.active = true;

  const services = await Service.find(query)
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .lean();
  return ok(services);
}

/** POST /api/services — create (auto id SRV######). */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const b = await req.json();
  if (!b.name?.trim()) return fail("Name is required", 400);
  if (b.price == null) return fail("Price is required", 400);

  const code = await nextId("SRV");
  const service = await Service.create({
    code,
    name: b.name.trim(),
    category: b.category || null,
    price: Number(b.price),
    profit: Number(b.profit || 0),
    image: b.image || null,
    description: b.description || "",
    discount: b.discount || {},
    timeSpendMin: Number(b.timeSpendMin || 30),
    timeSlots: Array.isArray(b.timeSlots) ? b.timeSlots : [],
    active: b.active !== false,
  });
  return created(service, "Service added");
}

async function putHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const { id, ...fields } = await req.json();
  if (!id) return fail("id is required", 400);

  if (fields.image) {
    const prev = await Service.findById(id).select("image").lean();
    if (prev?.image?.publicId && prev.image.publicId !== fields.image.publicId) {
      cloudinaryService.destroy(prev.image.publicId).catch(() => {});
    }
  }

  const service = await Service.findByIdAndUpdate(id, { $set: fields }, { new: true })
    .populate("category", "name")
    .lean();
  if (!service) return fail("Service not found", 404);
  return ok(service, "Service updated");
}

async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("id is required", 400);

  const service = await Service.findById(id).select("image").lean();
  if (service?.image?.publicId) cloudinaryService.destroy(service.image.publicId).catch(() => {});
  await Service.findByIdAndDelete(id);
  return ok(null, "Service removed");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
