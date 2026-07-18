import mongoose from "mongoose";

// Holds an incrementing sequence per prefix (BILL, ORD, BOOK ...).
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // the prefix, e.g. "BILL"
  seq: { type: Number, default: 0 },
});

export default mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
