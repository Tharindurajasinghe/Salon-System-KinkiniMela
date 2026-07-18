import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Staff accounts. Two roles: "admin" and "cashier".
 * Cashiers default to billing + orders pages; admin grants extra page access
 * via `pageAccess`. Usernames are globally unique (also vs customer names,
 * enforced at the route level).
 */
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "cashier"], default: "cashier" },
    // Extra admin-page keys a cashier may access (billing+orders always allowed).
    pageAccess: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Convenience: set a plain password, auto-hash it.
UserSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

// Compare a plaintext password to the stored hash.
UserSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
