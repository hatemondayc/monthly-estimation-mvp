// 개발용 익명 시드 데이터 (PRD §4.3).
// 실제 광고주명/브랜드명/JOB No./금액 절대 사용 금지 — 모두 익명 샘플.

import { recalcLine } from "@/lib/calculations";
import type { EstimateLine, EstimateVersion } from "@/types/estimate";

export interface Store {
  versions: EstimateVersion[];
  lines: EstimateLine[];
  owners: string[];
}

const NOW = "2026-06-01T00:00:00.000Z";

function line(partial: Partial<EstimateLine> & { id: string; versionId: string }): EstimateLine {
  const base: EstimateLine = {
    settlementType: "제작",
    advertiserName: "",
    brandName: "",
    campaignCode: "",
    campaignName: "",
    jobTypeName: "",
    jobCode: "",
    jobName: "",
    accountingMonth: "2026-06",
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
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
  // 파생 필드는 항상 재계산해서 일관성 유지
  return recalcLine(base);
}

/** 첫 실행 시 비어 있는 저장소를 채울 익명 샘플 묶음을 만든다. */
export function buildSeed(): Store {
  const firstVersion: EstimateVersion = {
    id: "ver-2026-06-first",
    yearMonth: "2026-06",
    teamScope: "커머스셀",
    roundType: "first",
    roundLabel: "1차 추정",
    memo: "샘플 1차 추정 (익명 데이터)",
    createdBy: "샘플사용자",
    createdAt: NOW,
    updatedAt: NOW,
  };

  const updateVersion: EstimateVersion = {
    id: "ver-2026-06-update",
    yearMonth: "2026-06",
    teamScope: "커머스셀",
    roundType: "update",
    roundLabel: "중간·월말 업데이트",
    memo: "샘플 업데이트 (익명 데이터)",
    createdBy: "샘플사용자",
    createdAt: NOW,
    updatedAt: NOW,
  };

  const lines: EstimateLine[] = [
    // ── 1차 추정 ──
    line({
      id: "line-001",
      versionId: firstVersion.id,
      settlementType: "제작",
      advertiserName: "광고주 A",
      brandName: "브랜드 A",
      campaignCode: "1000-C-26-0001",
      campaignName: "캠페인 A",
      jobTypeName: "공동구매",
      jobCode: "1000-C-26-0001.01",
      jobName: "6월 공동구매 A",
      gmv: 10000000,
      calculationType: "profit_rate",
      expectedMarginRate: 20,
      estimateStatus: "진행중",
      basisNote: "광고주 견적 기준",
      ownerName: "담당자 A",
    }),
    line({
      id: "line-002",
      versionId: firstVersion.id,
      settlementType: "제작",
      advertiserName: "광고주 B",
      brandName: "브랜드 B",
      campaignCode: "1000-C-26-0002",
      campaignName: "캠페인 B",
      jobTypeName: "PPL",
      jobCode: "1000-C-26-0002.01",
      jobName: "6월 PPL B",
      gmv: 5000000,
      calculationType: "cost_based",
      cost: 3500000,
      estimateStatus: "예상",
      basisNote: "전월 유사 캠페인 기준",
      ownerName: "담당자 B",
    }),
    line({
      id: "line-003",
      versionId: firstVersion.id,
      settlementType: "매체",
      advertiserName: "광고주 C",
      brandName: "브랜드 C",
      campaignCode: "1000-C-26-0003",
      campaignName: "캠페인 C",
      jobTypeName: "바이럴",
      jobCode: "1000-C-26-0003.01",
      jobName: "6월 바이럴 C",
      gmv: 8000000,
      revenue: 1200000,
      isRevenueManual: true,
      calculationType: "manual_profit",
      profit: 400000,
      estimateStatus: "예상",
      basisNote: "중간 Fee 구조, 매체 정산",
      remark: "광고주 회신 대기",
      ownerName: "담당자 A",
    }),

    // ── 업데이트 ──
    line({
      id: "line-101",
      versionId: updateVersion.id,
      settlementType: "제작",
      advertiserName: "광고주 A",
      brandName: "브랜드 A",
      campaignCode: "1000-C-26-0001",
      campaignName: "캠페인 A",
      jobTypeName: "공동구매",
      jobCode: "1000-C-26-0001.01",
      jobName: "6월 공동구매 A",
      gmv: 12000000,
      calculationType: "profit_rate",
      expectedMarginRate: 22,
      estimateStatus: "진행중",
      basisNote: "진행률 70% 기준, 상향",
      ownerName: "담당자 A",
    }),
    line({
      id: "line-102",
      versionId: updateVersion.id,
      settlementType: "제작",
      advertiserName: "광고주 B",
      brandName: "브랜드 B",
      campaignCode: "1000-C-26-0002",
      campaignName: "캠페인 B",
      jobTypeName: "PPL",
      jobCode: "1000-C-26-0002.01",
      jobName: "6월 PPL B",
      gmv: 4500000,
      calculationType: "cost_based",
      cost: 3200000,
      estimateStatus: "진행중",
      basisNote: "6월 청구 예정, 소폭 하향",
      ownerName: "담당자 B",
    }),
  ];

  return {
    versions: [firstVersion, updateVersion],
    lines,
    owners: ["담당자 A", "담당자 B"],
  };
}
