/**
 * One-time bootstrap script: creates the first admin + default Settings doc.
 * Run locally after filling .env:
 *
 *   node scripts/seedAdmin.mjs
 *
 * Self-contained (uses mongoose + bcryptjs directly) so it needs no path alias.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";

// --- tiny .env loader (avoids an extra dependency) ---
try {
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.warn("No .env file found — relying on shell environment.");
}

const ADMIN_USERNAME = process.env.SEED_ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASS || "admin123";

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // Create admin if not present.
  const users = db.collection("users");
  const exists = await users.findOne({ username: ADMIN_USERNAME });
  if (exists) {
    console.log(`Admin "${ADMIN_USERNAME}" already exists — skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await users.insertOne({
      username: ADMIN_USERNAME,
      passwordHash,
      role: "admin",
      pageAccess: [],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Created admin -> username: ${ADMIN_USERNAME}  password: ${ADMIN_PASSWORD}`);
    console.log("!! Change this password after first login.");
  }

  // Ensure a default Settings document.
  const settings = db.collection("settings");
  const s = await settings.findOne({ key: "main" });
  if (!s) {
    await settings.insertOne({
      key: "main",
      salonName: "My Salon",
      tagline: "Beauty & Care",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Created default Settings document.");
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
