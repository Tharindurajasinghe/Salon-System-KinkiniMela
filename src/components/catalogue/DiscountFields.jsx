"use client";

import Input from "@/components/ui/Input";

/**
 * Optional discount fields (percentage + small note). When the percentage is
 * greater than 0 the customer cards show a big % label with the note.
 * value = { percentage, note }, onChange(next)
 */
export default function DiscountFields({ value = {}, onChange }) {
  const percentage = value.percentage || 0;
  const note = value.note || "";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Discount %"
        type="number"
        min="0"
        max="100"
        value={percentage}
        onChange={(e) => onChange({ ...value, percentage: Number(e.target.value) })}
        placeholder="0"
      />
      <Input
        label="Discount note"
        value={note}
        onChange={(e) => onChange({ ...value, note: e.target.value })}
        placeholder="e.g. New year offer"
      />
    </div>
  );
}
