// Home Summary (PRD §11.2). 선택 월/팀의 1차 추정·업데이트 요약과 증감 표시.

import { getCompare, getSummary, getVersions } from "@/lib/data";
import { SummaryCards } from "@/components/SummaryCards";
import { VersionSwitcher } from "@/components/VersionSwitcher";
import { formatDelta, formatDeltaPercent } from "@/lib/format";
import type { EstimateSummary } from "@/types/estimate";

const EMPTY: EstimateSummary = {
  totalGmv: 0,
  totalRevenue: 0,
  totalProfit: 0,
  marginRate: 0,
  lineCount: 0,
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ versionId?: string }>;
}) {
  const { versionId } = await searchParams;
  const versions = await getVersions();

  if (versions.length === 0) {
    return (
      <EmptyState text="아직 버전이 없습니다. '추정 입력'에서 데이터를 추가하세요." />
    );
  }

  const selected =
    versions.find((v) => v.id === versionId) ?? versions[0];
  const compare = await getCompare(selected.yearMonth, selected.teamScope);

  const firstSummary = compare.firstVersion
    ? await getSummary(compare.firstVersion.id)
    : EMPTY;
  const updateSummary = compare.updateVersion
    ? await getSummary(compare.updateVersion.id)
    : EMPTY;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">월별 요약</h1>
          <p className="text-sm text-slate-500">
            {selected.yearMonth} · {selected.teamScope}
          </p>
        </div>
        <VersionSwitcher
          versions={versions}
          currentId={selected.id}
          basePath="/dashboard"
        />
      </div>

      <SummaryCards title="1차 추정" summary={firstSummary} />
      <SummaryCards title="중간·월말 업데이트" summary={updateSummary} accent />

      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-600">
          1차 대비 증감
        </h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">항목</th>
                <th className="px-4 py-2 text-right font-medium">1차 추정</th>
                <th className="px-4 py-2 text-right font-medium">업데이트</th>
                <th className="px-4 py-2 text-right font-medium">증감</th>
                <th className="px-4 py-2 text-right font-medium">증감률</th>
              </tr>
            </thead>
            <tbody>
              {compare.totals.map((r) => (
                <tr key={r.label} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-700">{r.label}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {fmtCell(r.label, r.first)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {fmtCell(r.label, r.updated)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right tabular-nums ${deltaColor(
                      r.deltaValue,
                    )}`}
                  >
                    {r.label === "평균 이익률"
                      ? formatDeltaPercent(r.deltaValue)
                      : formatDelta(r.deltaValue)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right tabular-nums ${deltaColor(
                      r.deltaRate,
                    )}`}
                  >
                    {formatDeltaPercent(r.deltaRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function fmtCell(label: string, value: number): string {
  if (label === "평균 이익률") return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString("ko-KR");
}

function deltaColor(v: number): string {
  if (v > 0) return "text-emerald-600";
  if (v < 0) return "text-red-600";
  return "text-slate-400";
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
