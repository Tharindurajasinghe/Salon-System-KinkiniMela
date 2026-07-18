"use client";

import clsx from "clsx";

/**
 * Labelled text input, reused across every admin form. Pass `error` to show a
 * validation message. Renders a <textarea> when `as="textarea"`.
 */
export default function Input({
  label,
  error,
  as = "input",
  className,
  id,
  ...props
}) {
  const Field = as === "textarea" ? "textarea" : "input";
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <Field
        id={inputId}
        className={clsx(
          "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900",
          "placeholder:text-gray-400 focus:outline-none focus:ring-2",
          error
            ? "border-red-300 focus:ring-red-200"
            : "border-gray-200 focus:border-brand-400 focus:ring-brand-100",
          as === "textarea" && "min-h-[96px] resize-y",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
