// 추정 입력 화면 (PRD §11.3). 버전 선택 후 행 단위 입력.

import { getLines, getOwnerNames, getVersions } from "@/lib/data";
import { EstimateTable } from "@/components/EstimateTable";
import { VersionSwitcher } from "@/components/VersionSwitcher";
import { ROUND_LABELS } from "@/types/estimate";

export default async function EstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{ versionId?: string }>;
}) {
  const { versionId } = await searchParams;
  const versions = await getVersions();

  if (versions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        버전이 없습니다. (시드 데이터가 생성되지 않았다면 서버 로그를 확인하세요.)
      </div>
    );
  }

  const selected = versions.find((v) => v.id === versionId) ?? versions[0];
  const [lines, ownerOptions] = await Promise.all([
    getLines(selected.id),
    getOwnerNames(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">추정 입력</h1>
          <p className="text-sm text-slate-500">
            {selected.yearMonth} · {selected.teamScope} ·{" "}
            {ROUND_LABELS[selected.roundType]}
          </p>
        </div>
        <VersionSwitcher
          versions={versions}
          currentId={selected.id}
          basePath="/estimates"
        />
      </div>

      <EstimateTable
        key={selected.id}
        versionId={selected.id}
        initialLines={lines}
        ownerOptions={ownerOptions}
      />
    </div>
  );
}
