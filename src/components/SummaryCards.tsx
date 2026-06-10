// 요약 카드 (PRD §11.2). 단일 버전 요약을 카드 묶음으로 표시.

import { formatNumber, formatPercent } from "@/lib/format";
import type { EstimateSummary } from "@/types/estimate";

export function SummaryCards({
  title,
  summary,
  accent = false,
}: {
  title: string;
  summary: EstimateSummary;
  accent?: boolean;
}) {
  const items = [
    { label: "총 취급고", value: formatNumber(summary.totalGmv) },
    { label: "총 매출액", value: formatNumber(summary.totalRevenue) },
    { label: "총 매출이익", value: formatNumber(summary.totalProfit) },
    { label: "이익률", value: formatPercent(summary.marginRate) },
  ];

  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-slate-600">
        {title}{" "}
        <span className="text-slate-400">({summary.lineCount}건)</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((it) => (
          <div
            key={it.label}
            className={`rounded-lg border p-4 ${
              accent
                ? "border-slate-300 bg-white"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="text-xs text-slate-500">{it.label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
              {it.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
