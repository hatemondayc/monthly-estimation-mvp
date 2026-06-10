"use client";

// 핵심 입력 화면 (PRD §11.3). 행 추가/수정/삭제 + 계산 자동화 + gmv/revenue 연동.
// 즉시 피드백은 로컬 재계산(calculateLine)으로, 영속화는 onBlur/onChange 시 API 호출로.
// 컬럼 순서는 기존 회사 엑셀 흐름(식별 → 금액 → 상태/메모)에 맞춘다.

import { useState } from "react";

import { CalculationTypeSelect } from "@/components/CalculationTypeSelect";
import { calculateLine } from "@/lib/calculations";
import { formatPercent, parseNumberInput } from "@/lib/format";
import { campaignCodeWarning, jobCodeWarning } from "@/lib/validation";
import { ESTIMATE_STATUSES, SETTLEMENT_TYPES } from "@/types/estimate";
import type {
  CalculationType,
  EstimateLine,
  SettlementType,
} from "@/types/estimate";

function recompute(line: EstimateLine): EstimateLine {
  const r = calculateLine({
    calculationType: line.calculationType,
    gmv: line.gmv,
    revenue: line.revenue,
    isRevenueManual: line.isRevenueManual,
    cost: line.cost,
    profit: line.profit,
    expectedMarginRate: line.expectedMarginRate,
  });
  return { ...line, revenue: r.revenue, cost: r.cost, profit: r.profit, actualMarginRate: r.actualMarginRate };
}

const OWNER_LIST_ID = "owner-options";

export function EstimateTable({
  versionId,
  initialLines,
  ownerOptions,
}: {
  versionId: string;
  initialLines: EstimateLine[];
  ownerOptions: string[];
}) {
  const [lines, setLines] = useState<EstimateLine[]>(initialLines);
  const [busy, setBusy] = useState(false);

  // patch를 로컬 상태에 반영하고 재계산된 행을 반환한다.
  function patchLocal(id: string, patch: Partial<EstimateLine>): EstimateLine | null {
    let result: EstimateLine | null = null;
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const next = recompute({ ...l, ...patch });
        result = next;
        return next;
      }),
    );
    return result;
  }

  // 재계산된 행을 서버에 직접 전달 — stale closure를 피한다.
  async function persistLine(line: EstimateLine) {
    await fetch(`/api/lines/${line.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(line),
    });
  }

  // 현재 상태의 행을 찾아 persist (텍스트 입력 onBlur 용).
  function persistById(id: string) {
    const cur = lines.find((x) => x.id === id);
    if (cur) persistLine(cur);
  }

  async function addRow() {
    setBusy(true);
    const res = await fetch("/api/lines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emptyPayload(versionId)),
    });
    setBusy(false);
    if (res.ok) {
      const { line } = (await res.json()) as { line: EstimateLine };
      setLines((prev) => [...prev, line]);
    } else if (res.status === 401) {
      alert("세션이 만료됐습니다. 페이지를 새로고침해 주세요.");
    }
  }

  async function removeRow(id: string) {
    if (!confirm("이 행을 삭제할까요?")) return;
    const res = await fetch(`/api/lines/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLines((prev) => prev.filter((l) => l.id !== id));
    } else if (res.status === 401) {
      alert("세션이 만료됐습니다. 페이지를 새로고침해 주세요.");
    }
  }

  function resetRevenue(id: string) {
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    const next = patchLocal(id, { isRevenueManual: false, revenue: line.gmv });
    if (next) persistLine(next);
  }

  const num = (v: number) => (v === 0 ? "" : String(v));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{lines.length}건</span>
        <div className="flex gap-2">
          <a
            href={`/api/export?versionId=${versionId}`}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            CSV 내보내기
          </a>
          <button
            onClick={addRow}
            disabled={busy}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            + 행 추가
          </button>
        </div>
      </div>

      {/* 담당자 자동완성 — 기존 담당자명 unique 목록. 자유 입력도 허용. */}
      <datalist id={OWNER_LIST_ID}>
        {ownerOptions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-[1700px] text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="[&>th]:whitespace-nowrap [&>th]:px-2 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
              <th>회계기간</th>
              <th>정산</th>
              <th>광고주</th>
              <th>브랜드</th>
              <th>캠페인번호</th>
              <th>캠페인명</th>
              <th>JOB유형</th>
              <th>JOB번호</th>
              <th>JOB명</th>
              <th>담당자</th>
              <th>계산방식</th>
              <th className="!text-right">취급고</th>
              <th className="!text-right">매출액</th>
              <th className="!text-right">원가</th>
              <th className="!text-right">매출이익</th>
              <th className="!text-right">예상%</th>
              <th className="!text-right">실적%</th>
              <th>상태</th>
              <th>추정근거</th>
              <th>비고</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="[&_input]:w-full [&_input]:rounded [&_input]:border [&_input]:border-slate-200 [&_input]:px-1.5 [&_input]:py-1 [&_select]:rounded [&_select]:border [&_select]:border-slate-200 [&_select]:px-1 [&_select]:py-1">
            {lines.map((l) => {
              const campWarn = campaignCodeWarning(l.campaignCode);
              const jobWarn = jobCodeWarning(l.jobCode, l.campaignCode);
              return (
                <tr key={l.id} className="border-t border-slate-100 align-top [&>td]:px-1.5 [&>td]:py-1">
                  <td className="w-20"><input value={l.accountingMonth} placeholder="2026-06" onChange={(e) => patchLocal(l.id, { accountingMonth: e.target.value })} onBlur={() => persistById(l.id)} /></td>
                  <td className="w-16">
                    <select
                      value={l.settlementType}
                      onChange={(e) => {
                        const next = patchLocal(l.id, { settlementType: e.target.value as SettlementType });
                        if (next) persistLine(next);
                      }}
                    >
                      {SETTLEMENT_TYPES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="w-24"><input value={l.advertiserName} onChange={(e) => patchLocal(l.id, { advertiserName: e.target.value })} onBlur={() => persistById(l.id)} /></td>
                  <td className="w-24"><input value={l.brandName} onChange={(e) => patchLocal(l.id, { brandName: e.target.value })} onBlur={() => persistById(l.id)} /></td>
                  <td className="w-28">
                    <input value={l.campaignCode} placeholder="1000-C-26-0001" onChange={(e) => patchLocal(l.id, { campaignCode: e.target.value })} onBlur={() => persistById(l.id)} />
                    {campWarn && <p className="mt-0.5 text-[10px] text-amber-600">{campWarn}</p>}
                  </td>
                  <td className="w-24"><input value={l.campaignName} onChange={(e) => patchLocal(l.id, { campaignName: e.target.value })} onBlur={() => persistById(l.id)} /></td>
                  <td className="w-20"><input value={l.jobTypeName} onChange={(e) => patchLocal(l.id, { jobTypeName: e.target.value })} onBlur={() => persistById(l.id)} /></td>
                  <td className="w-32">
                    <input value={l.jobCode} placeholder="1000-C-26-0001.01" onChange={(e) => patchLocal(l.id, { jobCode: e.target.value })} onBlur={() => persistById(l.id)} />
                    {jobWarn && <p className="mt-0.5 text-[10px] text-amber-600">{jobWarn}</p>}
                  </td>
                  <td className="w-28"><input value={l.jobName} onChange={(e) => patchLocal(l.id, { jobName: e.target.value })} onBlur={() => persistById(l.id)} /></td>
                  <td className="w-20"><input list={OWNER_LIST_ID} value={l.ownerName} onChange={(e) => patchLocal(l.id, { ownerName: e.target.value })} onBlur={() => persistById(l.id)} /></td>
                  <td className="w-28">
                    <CalculationTypeSelect
                      value={l.calculationType}
                      onChange={(next: CalculationType) => {
                        const updated = patchLocal(l.id, { calculationType: next });
                        if (updated) persistLine(updated);
                      }}
                    />
                  </td>
                  <td className="w-24">
                    <input className="cell-num" inputMode="numeric" value={num(l.gmv)} onChange={(e) => patchLocal(l.id, { gmv: parseNumberInput(e.target.value) })} onBlur={() => persistById(l.id)} />
                  </td>
                  <td className="w-28">
                    <input className="cell-num" inputMode="numeric" value={num(l.revenue)} onChange={(e) => patchLocal(l.id, { revenue: parseNumberInput(e.target.value), isRevenueManual: true })} onBlur={() => persistById(l.id)} />
                    {l.isRevenueManual && (
                      <button onClick={() => resetRevenue(l.id)} className="mt-0.5 text-[10px] text-blue-600 hover:underline">
                        취급고와 동일
                      </button>
                    )}
                  </td>
                  <td className="w-24">
                    <input className="cell-num" inputMode="numeric" disabled={l.calculationType === "profit_rate" || l.calculationType === "manual_profit"} value={num(l.cost)} onChange={(e) => patchLocal(l.id, { cost: parseNumberInput(e.target.value) })} onBlur={() => persistById(l.id)} />
                  </td>
                  <td className="w-24">
                    <input className="cell-num" inputMode="numeric" disabled={l.calculationType !== "manual_profit" && l.calculationType !== "mixed"} value={num(l.profit)} onChange={(e) => patchLocal(l.id, { profit: parseNumberInput(e.target.value) })} onBlur={() => persistById(l.id)} />
                  </td>
                  <td className="w-16">
                    <input className="cell-num" inputMode="numeric" disabled={l.calculationType !== "profit_rate"} value={num(l.expectedMarginRate)} onChange={(e) => patchLocal(l.id, { expectedMarginRate: parseNumberInput(e.target.value) })} onBlur={() => persistById(l.id)} />
                  </td>
                  <td className="w-16 cell-num text-slate-500">{formatPercent(l.actualMarginRate)}</td>
                  <td className="w-20">
                    <select value={l.estimateStatus} onChange={(e) => {
                      const next = patchLocal(l.id, { estimateStatus: e.target.value as EstimateLine["estimateStatus"] });
                      if (next) persistLine(next);
                    }}>
                      {ESTIMATE_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </td>
                  <td className="w-32"><input value={l.basisNote} onChange={(e) => patchLocal(l.id, { basisNote: e.target.value })} onBlur={() => persistById(l.id)} /></td>
                  <td className="w-32"><input value={l.remark} onChange={(e) => patchLocal(l.id, { remark: e.target.value })} onBlur={() => persistById(l.id)} /></td>
                  <td className="w-8">
                    <button onClick={() => removeRow(l.id)} className="text-slate-400 hover:text-red-600" title="삭제">✕</button>
                  </td>
                </tr>
              );
            })}
            {lines.length === 0 && (
              <tr>
                <td colSpan={21} className="px-4 py-8 text-center text-slate-400">
                  행이 없습니다. "+ 행 추가"로 시작하세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        계산방식: 이익률·매출이익 직접입력은 원가를 자동 산출, 원가 기준은 원가 입력, 복합은 매출액·원가·매출이익을 직접 입력합니다. 매출액은 기본적으로 취급고와 동기화되며, 직접 수정하면 "취급고와 동일" 버튼으로 되돌릴 수 있습니다. 캠페인번호/JOB번호 형식 경고는 저장을 막지 않습니다.
      </p>
    </div>
  );
}

function emptyPayload(versionId: string) {
  return {
    versionId,
    settlementType: "제작",
    advertiserName: "",
    brandName: "",
    campaignCode: "",
    campaignName: "",
    jobTypeName: "",
    jobCode: "",
    jobName: "",
    accountingMonth: "",
    gmv: 0,
    revenue: 0,
    isRevenueManual: false,
    cost: 0,
    profit: 0,
    expectedMarginRate: 0,
    actualMarginRate: 0,
    calculationType: "profit_rate",
    estimateStatus: "예상",
    basisNote: "",
    remark: "",
    ownerName: "",
  };
}
