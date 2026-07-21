"use client";

import clsx from "clsx";

/**
 * Reusable pill tab bar. Controlled component.
 * Used by Settings, Our Services, Summary, Orders filters, etc.
 *
 * <Tabs tabs={[{key,label}]} active={key} onChange={setKey} />
 */
export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div
      className={clsx(
        "flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            "shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            active === tab.key
              ? "bg-white text-brand-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}