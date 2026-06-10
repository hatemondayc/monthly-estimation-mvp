// 데이터 모델 (PRD §7). 향후 Creator Commerce OS 병합을 고려해 필드명을 유지한다.

/** 정산 구분 (PRD §5.1). 팀 실적 대부분은 제작. */
export type SettlementType = "제작" | "매체";

/** 버전 구분 (PRD §6). 회계 마감/ERP 확정은 범위 제외. */
export type RoundType = "first" | "update";

/** 계산 방식 (PRD §8). */
export type CalculationType =
  | "profit_rate" // 이익률 기준
  | "cost_based" // 원가 기준
  | "manual_profit" // 매출이익 직접 입력
  | "mixed"; // 복합 (revenue/cost/profit 직접 입력)

/** 추정 상태 (PRD §7.2). */
export type EstimateStatus = "예상" | "진행중" | "확정" | "이월가능" | "제외";

/** 신뢰도 (PRD §7.2). */
export type ConfidenceLevel = "High" | "Mid" | "Low";

/** 월별 추정 버전 단위 (PRD §7.1). */
export interface EstimateVersion {
  id: string;
  yearMonth: string; // 예: 2026-06
  teamScope: string; // 디이팀 / 커머스셀
  roundType: RoundType;
  roundLabel: string; // 1차 추정 / 중간·월말 업데이트
  memo: string;
  createdBy: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/** 실적 추정 행 단위 (PRD §7.2). */
export interface EstimateLine {
  id: string;
  versionId: string;
  settlementType: SettlementType;
  advertiserName: string;
  brandName: string;
  campaignName: string;
  jobTypeName: string;
  jobCode: string;
  jobName: string;
  accountingMonth: string; // 회계기간
  gmv: number; // 취급고
  revenue: number; // 매출액
  isRevenueManual: boolean; // 매출액 수동수정 여부
  cost: number; // 매출원가
  profit: number; // 매출이익
  expectedMarginRate: number; // 예상이익률 (%)
  actualMarginRate: number; // 실적이익률 (%) — 계산값
  calculationType: CalculationType;
  estimateStatus: EstimateStatus;
  confidenceLevel: ConfidenceLevel;
  basisNote: string; // 추정근거
  remark: string; // 비고
  ownerName: string; // 담당자
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/** 합계/요약 단위 (PRD §11.2 / §11.4). */
export interface EstimateSummary {
  totalGmv: number;
  totalRevenue: number;
  totalProfit: number;
  marginRate: number; // 총 이익률 (%)
  lineCount: number;
}

// ── 선택 옵션 상수 (UI 드롭다운 등에서 재사용) ──────────────────────────

export const SETTLEMENT_TYPES: SettlementType[] = ["제작", "매체"];

export const CALCULATION_TYPES: { value: CalculationType; label: string }[] = [
  { value: "profit_rate", label: "이익률 기준" },
  { value: "cost_based", label: "원가 기준" },
  { value: "manual_profit", label: "매출이익 직접입력" },
  { value: "mixed", label: "복합(직접입력)" },
];

export const ESTIMATE_STATUSES: EstimateStatus[] = [
  "예상",
  "진행중",
  "확정",
  "이월가능",
  "제외",
];

export const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["High", "Mid", "Low"];

export const ROUND_LABELS: Record<RoundType, string> = {
  first: "1차 추정",
  update: "중간·월말 업데이트",
};
