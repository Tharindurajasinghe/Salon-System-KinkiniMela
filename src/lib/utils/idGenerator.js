import Counter from "@/lib/models/Counter";

/**
 * Generates sequential, prefixed, zero-padded IDs using an atomic counter
 * document (so two concurrent requests never get the same number).
 *
 *   nextId("BILL")  -> "BILL000001"
 *   nextId("ORD")   -> "ORD000001"
 *   nextId("BOOK")  -> "BOOK000001"
 */
export async function nextId(prefix, pad = 6) {
  const counter = await Counter.findOneAndUpdate(
    { _id: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}${String(counter.seq).padStart(pad, "0")}`;
}
