"use client";

import clsx from "clsx";

/** Small on/off toggle used for active/deactivate. */
export default function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
      role="switch"
      aria-checked={checked}
    >
      <span
        className={clsx(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-brand-500" : "bg-gray-300"
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked && "translate-x-5"
          )}
        />
      </span>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </button>
  );
}
