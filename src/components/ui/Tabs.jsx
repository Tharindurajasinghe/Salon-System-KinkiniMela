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
    <div className={clsx("inline-flex rounded-xl bg-gray-100 p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
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
