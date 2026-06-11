// 서비스 계층 (PRD §14 Step 4). 도메인 규칙(재계산/요약/비교)을 모아 둔다.
// UI/API는 repository 를 직접 만지지 않고 이 모듈을 통해서만 접근한다.

import { calculateLine, delta, summarize } from "@/lib/calculations";
import { repository } from "@/lib/repository";
import type {
  EstimateLine,
  EstimateSummary,
  EstimateVersion,
} from "@/types/estimate";

export type NewVersionInput = Omit<
  EstimateVersion,
  "id" | "createdAt" | "updatedAt"
>;
export type NewLineInput = Omit<EstimateLine, "id" | "createdAt" | "updatedAt">;

// ── 버전 ────────────────────────────────────────────────────────────

export function getVersions(): Promise<EstimateVersion[]> {
  return repository.listVersions();
}

export function getVersion(id: string): Promise<EstimateVersion | null> {
  return repository.getVersion(id);
}

export function createVersion(input: NewVersionInput): Promise<EstimateVersion> {
  return repository.createVersion(input);
}

export function updateVersion(
  id: string,
  patch: Partial<EstimateVersion>,
): Promise<EstimateVersion | null> {
  return repository.updateVersion(id, patch);
}

export function deleteVersion(id: string): Promise<boolean> {
  return repository.deleteVersion(id);
}

// ── 행 (계산 필드는 저장 전에 항상 재계산) ──────────────────────────

/** 입력 금액/비율로부터 파생 필드를 채운 행 데이터를 만든다. */
function applyCalc<T extends NewLineInput | EstimateLine>(line: T): T {
  const result = calculateLine({
    calculationType: line.calculationType,
    gmv: line.gmv,
    revenue: line.revenue,
    isRevenueManual: line.isRevenueManual,
    cost: line.cost,
    profit: line.profit,
    expectedMarginRate: line.expectedMarginRate,
  });
  return {
    ...line,
    revenue: result.revenue,
    cost: result.cost,
    profit: result.profit,
    actualMarginRate: result.actualMarginRate,
  };
}

export function getLines(versionId?: string): Promise<EstimateLine[]> {
  return repository.listLines(versionId);
}

export async function createLine(input: NewLineInput): Promise<EstimateLine> {
  const line = await repository.createLine(applyCalc(input));
  // 신규 담당자는 owners 마스터에 등록해 datalist가 즉시 반영되도록 한다.
  if (input.ownerName.trim()) {
    await repository.addOwner(input.ownerName);
  }
  return line;
}

export async function updateLine(
  id: string,
  patch: Partial<EstimateLine>,
): Promise<EstimateLine | null> {
  // merge와 파생 필드 재계산(applyCalc)을 repository의 enqueue 락 안에서 수행한다.
  // 락 밖에서 읽으면 같은 행을 동시에 PATCH할 때 stale read로 먼저 쓴 값이 유실된다.
  const line = await repository.updateLine(id, patch, applyCalc);
  if (line && patch.ownerName?.trim()) {
    await repository.addOwner(patch.ownerName);
  }
  return line;
}

export function deleteLine(id: string): Promise<boolean> {
  return repository.deleteLine(id);
}

/** owners 마스터 + 행에서 담당자명 unique 목록을 반환한다 — datalist 자동완성용. */
export async function getOwnerNames(): Promise<string[]> {
  const [owners, lines] = await Promise.all([
    repository.listOwners(),
    repository.listLines(),
  ]);
  const names = new Set<string>(owners);
  for (const l of lines) {
    if (l.ownerName.trim()) names.add(l.ownerName.trim());
  }
  return [...names].sort((a, b) => a.localeCompare(b, "ko"));
}

/** 담당자 마스터에 이름을 추가한다 (trim·빈값 skip은 repository 내부에서 처리). */
export function addOwner(name: string): Promise<void> {
  return repository.addOwner(name);
}

// ── 요약 / 비교 ────────────────────────────────────────────────────

export async function getSummary(versionId: string): Promise<EstimateSummary> {
  const lines = await repository.listLines(versionId);
  return summarize(lines);
}

/** 같은 월/팀의 1차 추정 ↔ 업데이트 버전을 찾아 비교한다. (PRD §11.4) */
export interface CompareRow {
  label: string;
  first: number;
  updated: number;
  deltaValue: number;
  deltaRate: number;
}

export interface CompareGroupRow {
  key: string;
  firstProfit: number;
  updatedProfit: number;
  deltaValue: number;
  deltaRate: number;
}

export interface CompareResult {
  yearMonth: string;
  teamScope: string;
  firstVersion: EstimateVersion | null;
  updateVersion: EstimateVersion | null;
  totals: CompareRow[];
  byBrand: CompareGroupRow[];
  byJob: CompareGroupRow[];
}

function groupProfit(lines: EstimateLine[], keyOf: (l: EstimateLine) => string) {
  const map = new Map<string, number>();
  for (const l of lines) {
    map.set(keyOf(l), (map.get(keyOf(l)) ?? 0) + l.profit);
  }
  return map;
}

function buildGroupRows(
  firstLines: EstimateLine[],
  updatedLines: EstimateLine[],
  keyOf: (l: EstimateLine) => string,
): CompareGroupRow[] {
  const firstMap = groupProfit(firstLines, keyOf);
  const updatedMap = groupProfit(updatedLines, keyOf);
  const keys = new Set<string>([...firstMap.keys(), ...updatedMap.keys()]);
  return [...keys].map((key) => {
    const firstProfit = firstMap.get(key) ?? 0;
    const updatedProfit = updatedMap.get(key) ?? 0;
    const d = delta(firstProfit, updatedProfit);
    return {
      key: key || "(미입력)",
      firstProfit,
      updatedProfit,
      deltaValue: d.value,
      deltaRate: d.rate,
    };
  });
}

export async function getCompare(
  yearMonth: string,
  teamScope: string,
): Promise<CompareResult> {
  const versions = await repository.listVersions();
  const scoped = versions.filter(
    (v) => v.yearMonth === yearMonth && v.teamScope === teamScope,
  );
  const firstVersion = scoped.find((v) => v.roundType === "first") ?? null;
  const updateVersion = scoped.find((v) => v.roundType === "update") ?? null;

  // Fix 8: 두 listLines 호출을 병렬로 실행해 순차적 파일 읽기 2회를 1회로 줄인다.
  const [firstLines, updatedLines] = await Promise.all([
    firstVersion ? repository.listLines(firstVersion.id) : Promise.resolve([]),
    updateVersion ? repository.listLines(updateVersion.id) : Promise.resolve([]),
  ]);

  const fs = summarize(firstLines);
  const us = summarize(updatedLines);

  const row = (label: string, first: number, updated: number): CompareRow => {
    const d = delta(first, updated);
    return { label, first, updated, deltaValue: d.value, deltaRate: d.rate };
  };

  return {
    yearMonth,
    teamScope,
    firstVersion,
    updateVersion,
    totals: [
      row("총 취급고", fs.totalGmv, us.totalGmv),
      row("총 매출액", fs.totalRevenue, us.totalRevenue),
      row("총 매출이익", fs.totalProfit, us.totalProfit),
      row("평균 이익률", fs.marginRate, us.marginRate),
    ],
    byBrand: buildGroupRows(firstLines, updatedLines, (l) => l.brandName),
    byJob: buildGroupRows(firstLines, updatedLines, (l) => l.jobCode),
  };
}

/** 신규 행을 만들 때 쓰는 기본값 (PRD 기본값: 제작 / profit_rate). */
export function emptyLine(versionId: string): NewLineInput {
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
