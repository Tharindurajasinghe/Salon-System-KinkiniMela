import mongoose from "mongoose";

/**
 * MongoDB connection helper.
 *
 * On Vercel (serverless) every request can spin up a new function instance.
 * Without caching we would open a brand new connection on every request and
 * quickly exhaust the Atlas connection pool. We therefore cache the connection
 * on the Node.js `global` object so it is reused across invocations.
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

// Reuse a single cached connection between hot reloads / invocations.
let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // Already connected -> return the existing connection.
  if (cached.conn) return cached.conn;

  // No in-flight connection promise -> create one.
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset so the next request can retry a failed connection.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;
