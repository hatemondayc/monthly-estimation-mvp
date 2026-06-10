// 계산 로직 (PRD §8 계산 방식, §9 취급고/매출액 관계).
// 단일 수식으로 강제하지 않는다 — calculationType에 따라 분기한다.

import type {
  CalculationType,
  EstimateLine,
  EstimateSummary,
} from "@/types/estimate";

/** 계산 입력으로 쓰이는 금액/비율 필드 묶음. */
export interface CalcInput {
  calculationType: CalculationType;
  gmv: number;
  revenue: number;
  isRevenueManual: boolean;
  cost: number;
  profit: number;
  expectedMarginRate: number;
}

/** 계산 결과 — revenue/cost/profit/actualMarginRate 가 확정된다. */
export interface CalcResult {
  revenue: number;
  cost: number;
  profit: number;
  actualMarginRate: number;
  isRevenueManual: boolean;
}

/** revenue=0 가드를 둔 이익률(%). */
export function marginRate(profit: number, revenue: number): number {
  if (!revenue) return 0;
  return (profit / revenue) * 100;
}

/**
 * 취급고/매출액 동기화 규칙 (PRD §9).
 * isRevenueManual 이 false 이면 revenue 를 gmv 와 같게 맞춘다.
 */
export function syncRevenueWithGmv(input: CalcInput): number {
  return input.isRevenueManual ? input.revenue : input.gmv;
}

/**
 * calculationType 별 금액 계산. (PRD §8)
 * 입력값을 변형하지 않고 새 결과 객체를 돌려준다.
 */
export function calculateLine(input: CalcInput): CalcResult {
  const revenue = syncRevenueWithGmv(input);
  let cost = input.cost;
  let profit = input.profit;

  switch (input.calculationType) {
    case "profit_rate": {
      // 이익률 기준
      profit = (revenue * input.expectedMarginRate) / 100;
      cost = revenue - profit;
      break;
    }
    case "cost_based": {
      // 원가 기준
      profit = revenue - input.cost;
      cost = input.cost;
      break;
    }
    case "manual_profit": {
      // 매출이익 직접 입력
      profit = input.profit;
      cost = revenue - profit;
      break;
    }
    case "mixed": {
      // 복합: revenue/cost/profit 모두 직접 입력, 이익률만 계산
      cost = input.cost;
      profit = input.profit;
      break;
    }
  }

  return {
    revenue,
    cost,
    profit,
    actualMarginRate: marginRate(profit, revenue),
    isRevenueManual: input.isRevenueManual,
  };
}

/**
 * 한 행(EstimateLine)에 대해 계산 필드를 재계산해 새 객체를 반환한다.
 * 입력 행의 사용자 입력 필드는 유지하고 파생 필드만 갱신한다.
 */
export function recalcLine(line: EstimateLine): EstimateLine {
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

/** 여러 행을 합산해 요약(Summary)을 만든다. (PRD §11.2) */
export function summarize(lines: EstimateLine[]): EstimateSummary {
  const totals = lines.reduce(
    (acc, l) => {
      acc.totalGmv += l.gmv;
      acc.totalRevenue += l.revenue;
      acc.totalProfit += l.profit;
      return acc;
    },
    { totalGmv: 0, totalRevenue: 0, totalProfit: 0 },
  );

  return {
    totalGmv: totals.totalGmv,
    totalRevenue: totals.totalRevenue,
    totalProfit: totals.totalProfit,
    marginRate: marginRate(totals.totalProfit, totals.totalRevenue),
    lineCount: lines.length,
  };
}

/** 1차 추정 대비 업데이트 증감 계산 (절대값/증감률). (PRD §11.4) */
export interface DeltaResult {
  value: number;
  rate: number; // % (base=0 이면 0)
}

export function delta(base: number, updated: number): DeltaResult {
  const value = updated - base;
  const rate = base ? (value / base) * 100 : 0;
  return { value, rate };
}
