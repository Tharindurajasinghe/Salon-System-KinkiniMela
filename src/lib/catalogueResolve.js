import Product from "@/lib/models/Product";
import Service from "@/lib/models/Service";
import Package from "@/lib/models/Package";

/**
 * Resolves a { kind, refId } reference into the numbers billing needs:
 *   { name, sellingPrice, cost, image, active }
 * Cost model:
 *   product → cost = buyingPrice
 *   service → cost = price - profit
 *   package → cost = price - profit
 * Returns null if the item no longer exists.
 */
export async function resolveItem(kind, refId) {
  if (kind === "product") {
    const p = await Product.findById(refId).lean();
    if (!p) return null;
    return { name: p.name, sellingPrice: p.sellingPrice, cost: p.buyingPrice, image: p.image, active: p.active };
  }
  if (kind === "service") {
    const s = await Service.findById(refId).lean();
    if (!s) return null;
    return { name: s.name, sellingPrice: s.sellingPrice, cost: s.cost, image: s.image, active: s.active };
  }
  if (kind === "package") {
    const p = await Package.findById(refId).lean();
    if (!p) return null;
    return { name: p.name, sellingPrice: p.sellingPrice, cost: p.cost, image: p.images?.[0] || null, active: p.active };
  }
  return null;
}
