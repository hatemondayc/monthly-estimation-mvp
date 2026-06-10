// 버전 비교 (PRD §11.4). 같은 월/팀의 1차 추정 ↔ 업데이트 비교.

import { getCompare, getVersions } from "@/lib/data";
import { VersionSwitcher } from "@/components/VersionSwitcher";
import { formatDelta, formatDeltaPercent, formatNumber } from "@/lib/format";
import type { CompareGroupRow } from "@/lib/data";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ versionId?: string }>;
}) {
  const { versionId } = await searchParams;
  const versions = await getVersions();

  if (versions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        비교할 버전이 없습니다.
      </div>
    );
  }

  const selected = versions.find((v) => v.id === versionId) ?? versions[0];
  const compare = await getCompare(selected.yearMonth, selected.teamScope);

  const missing =
    !compare.firstVersion || !compare.updateVersion;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">버전 비교</h1>
          <p className="text-sm text-slate-500">
            {selected.yearMonth} · {selected.teamScope} · 1차 추정 vs 업데이트
          </p>
        </div>
        <VersionSwitcher
          versions={versions}
          currentId={selected.id}
          basePath="/compare"
        />
      </div>

      {missing && (
        <p className="rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          이 월/팀에는 1차 추정과 업데이트가 모두 있어야 완전한 비교가 됩니다.
          {!compare.firstVersion && " (1차 추정 없음)"}
          {!compare.updateVersion && " (업데이트 없음)"}
        </p>
      )}

      <CompareTable
        title="합계 비교"
        head={["항목", "1차 추정", "업데이트", "증감", "증감률"]}
        rows={compare.totals.map((r) => ({
          key: r.label,
          cells: [
            r.label,
            fmt(r.label, r.first),
            fmt(r.label, r.updated),
            r.label === "평균 이익률"
              ? formatDeltaPercent(r.deltaValue)
              : formatDelta(r.deltaValue),
            formatDeltaPercent(r.deltaRate),
          ],
          deltas: [r.deltaValue, r.deltaRate],
        }))}
      />

      <GroupTable title="브랜드별 매출이익 증감" rows={compare.byBrand} />
      <GroupTable title="JOB별 매출이익 증감" rows={compare.byJob} />
    </div>
  );
}

function fmt(label: string, value: number): string {
  if (label === "평균 이익률") return `${value.toFixed(1)}%`;
  return formatNumber(value);
}

function deltaColor(v: number): string {
  if (v > 0) return "text-emerald-600";
  if (v < 0) return "text-red-600";
  return "text-slate-400";
}

function CompareTable({
  title,
  head,
  rows,
}: {
  title: string;
  head: string[];
  rows: { key: string; cells: string[]; deltas: number[] }[];
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-slate-600">{title}</h2>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {head.map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2 font-medium ${i === 0 ? "text-left" : "text-right"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-slate-100">
                {r.cells.map((c, i) => (
                  <td
                    key={i}
                    className={`px-4 py-2 tabular-nums ${
                      i === 0 ? "text-left text-slate-700" : "text-right"
                    } ${i === 3 ? deltaColor(r.deltas[0]) : ""} ${
                      i === 4 ? deltaColor(r.deltas[1]) : ""
                    }`}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GroupTable({ title, rows }: { title: string; rows: CompareGroupRow[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-slate-600">{title}</h2>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left font-medium">구분</th>
              <th className="px-4 py-2 text-right font-medium">1차 이익</th>
              <th className="px-4 py-2 text-right font-medium">업데이트 이익</th>
              <th className="px-4 py-2 text-right font-medium">증감</th>
              <th className="px-4 py-2 text-right font-medium">증감률</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  데이터 없음
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-700">{r.key}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatNumber(r.firstProfit)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatNumber(r.updatedProfit)}</td>
                <td className={`px-4 py-2 text-right tabular-nums ${deltaColor(r.deltaValue)}`}>{formatDelta(r.deltaValue)}</td>
                <td className={`px-4 py-2 text-right tabular-nums ${deltaColor(r.deltaRate)}`}>{formatDeltaPercent(r.deltaRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
