import connectDB from "@/lib/db";
import Gallery from "@/lib/models/Gallery";
import { requireAuth, canAccess } from "@/lib/auth";
import { cloudinaryService } from "@/lib/services/CloudinaryService";
import { ok, created, fail, withErrorHandler } from "@/lib/utils/apiResponse";

function guard() {
  const { session, error } = requireAuth();
  if (error) return { error, status: 401 };
  if (!canAccess(session, "gallery")) return { error: "Not allowed", status: 403 };
  return { session };
}

/** GET /api/admin/gallery */
async function getHandler() {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();
  const photos = await Gallery.find().sort({ createdAt: -1 }).lean();
  return ok(photos);
}

/** POST /api/admin/gallery — { name, image } */
async function postHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();
  const { name, image } = await req.json();
  if (!name?.trim()) return fail("Name is required", 400);
  if (!image?.url) return fail("Image is required", 400);
  const photo = await Gallery.create({ name: name.trim(), image });
  return created(photo, "Photo added");
}

/** PUT /api/admin/gallery — { id, name?, image? } */
async function putHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();
  const { id, name, image } = await req.json();
  if (!id) return fail("id is required", 400);

  if (image) {
    const prev = await Gallery.findById(id).select("image").lean();
    if (prev?.image?.publicId && prev.image.publicId !== image.publicId) {
      cloudinaryService.destroy(prev.image.publicId).catch(() => {});
    }
  }
  const update = {};
  if (name !== undefined) update.name = name;
  if (image !== undefined) update.image = image;
  const photo = await Gallery.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!photo) return fail("Not found", 404);
  return ok(photo, "Photo updated");
}

/** DELETE /api/admin/gallery?id=... */
async function deleteHandler(req) {
  const g = guard();
  if (g.error) return fail(g.error, g.status);
  await connectDB();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("id is required", 400);
  const photo = await Gallery.findById(id).select("image").lean();
  if (photo?.image?.publicId) cloudinaryService.destroy(photo.image.publicId).catch(() => {});
  await Gallery.findByIdAndDelete(id);
  return ok(null, "Photo removed");
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
