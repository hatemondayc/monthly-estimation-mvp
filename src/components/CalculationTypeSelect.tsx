"use client";

import { CALCULATION_TYPES } from "@/types/estimate";
import type { CalculationType } from "@/types/estimate";

export function CalculationTypeSelect({
  value,
  onChange,
}: {
  value: CalculationType;
  onChange: (next: CalculationType) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CalculationType)}
      className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-xs focus:border-slate-500 focus:outline-none"
    >
      {CALCULATION_TYPES.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
