import mongoose from "mongoose";

/**
 * A booking for a SERVICE or a PACKAGE.
 * Time-slot uniqueness rule (from spec):
 *   one customer cannot book the same slot for the same item on the same day.
 * We enforce it with the compound unique index below.
 */
const BookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, unique: true }, // BOOK000001
    itemType: { type: String, enum: ["service", "package"], required: true },
    itemRef: { type: mongoose.Schema.Types.ObjectId, required: true }, // Service/Package _id
    itemName: { type: String, required: true }, // snapshot for history
    price: { type: Number, default: 0 },

    // Customer snapshot (customers do not log in).
    customer: {
      firstName: String,
      lastName: String,
      phone: { type: String, required: true },
      whatsapp: { type: String, default: "" },
      gender: { type: String, enum: ["male", "female", ""], default: "" },
    },

    date: { type: String, required: true }, // "yyyy-MM-dd" (SL time)
    timeSlot: { type: String, required: true }, // "10:00 AM"

    status: {
      type: String,
      enum: ["pending", "confirm", "rejected"],
      default: "pending",
    },
    rejectReason: { type: String, default: "" },

    // Where it came from: customer website or admin/cashier billing.
    source: { type: String, enum: ["web", "pos"], default: "web" },
  },
  { timestamps: true }
);

// Prevent double-booking the same item + day + slot by the same phone.
BookingSchema.index(
  { itemRef: 1, date: 1, timeSlot: 1, "customer.phone": 1 },
  { unique: true }
);

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
