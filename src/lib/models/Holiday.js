import mongoose from "mongoose";

// Off days set by admin on the Calendar page. Customers cannot book these.
const HolidaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // "yyyy-MM-dd"
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Holiday || mongoose.model("Holiday", HolidaySchema);
