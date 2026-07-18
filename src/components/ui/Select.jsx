"use client";

import clsx from "clsx";

/** Labelled native select, styled to match Input. */
export default function Select({ label, error, children, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={clsx(
          "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900",
          "focus:outline-none focus:ring-2",
          error ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:border-brand-400 focus:ring-brand-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
