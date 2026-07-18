import { NextResponse } from "next/server";

/**
 * Standard API response helpers so every route returns the same shape:
 *   { success: boolean, message: string, data?: any }
 * This keeps the frontend fetch handling simple and predictable.
 */
export function ok(data = null, message = "Success", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function created(data = null, message = "Created") {
  return ok(data, message, 201);
}

export function fail(message = "Something went wrong", status = 400, data = null) {
  return NextResponse.json({ success: false, message, data }, { status });
}

/** Wrap a route handler so thrown errors become clean JSON 500s. */
export function withErrorHandler(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("[API ERROR]", err);
      return fail(err.message || "Internal server error", 500);
    }
  };
}
