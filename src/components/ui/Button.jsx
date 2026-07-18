"use client";

import clsx from "clsx";

/**
 * Reusable button. One component, many looks — reused across the whole app
 * so we never re-style buttons ad-hoc (DRY, per the spec).
 *
 * <Button variant="primary" size="md" onClick={...}>Save</Button>
 */
const VARIANTS = {
  primary: "bg-brand-500 hover:bg-brand-600 text-white",
  gold: "bg-gold-500 hover:bg-gold-600 text-white",
  outline: "border border-brand-500 text-brand-600 hover:bg-brand-50",
  ghost: "text-brand-600 hover:bg-brand-50",
  danger: "bg-red-500 hover:bg-red-600 text-white",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
        "transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
