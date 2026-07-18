import clsx from "clsx";

/** Simple white surface used to group content across the admin. */
export default function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-gray-100 bg-white shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
