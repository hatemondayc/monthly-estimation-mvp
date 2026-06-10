"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ROUND_LABELS } from "@/types/estimate";
import type { EstimateVersion } from "@/types/estimate";

/**
 * 버전 선택 드롭다운. 선택 시 ?versionId= 쿼리로 네비게이션한다.
 * basePath 예: "/estimates", "/dashboard".
 */
export function VersionSwitcher({
  versions,
  currentId,
  basePath,
}: {
  versions: EstimateVersion[];
  currentId: string;
  basePath: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    next.set("versionId", e.target.value);
    router.push(`${basePath}?${next.toString()}`);
  }

  return (
    <select
      value={currentId}
      onChange={onChange}
      className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
    >
      {versions.map((v) => (
        <option key={v.id} value={v.id}>
          {v.yearMonth} · {v.teamScope} · {ROUND_LABELS[v.roundType]}
        </option>
      ))}
    </select>
  );
}
