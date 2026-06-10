// CSV Export (PRD §11.5 / §14 Step 5). 월/버전 단위 EstimateLine + Summary.

import type { EstimateLine, EstimateSummary } from "@/types/estimate";

/** CSV 셀 이스케이프 (콤마/따옴표/개행 대응). */
function cell(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const LINE_HEADERS = [
  "정산구분",
  "광고주",
  "브랜드",
  "캠페인",
  "JOB유형",
  "JOB코드",
  "JOB명",
  "회계기간",
  "취급고",
  "매출액",
  "매출액수동",
  "매출원가",
  "매출이익",
  "예상이익률",
  "실적이익률",
  "계산방식",
  "상태",
  "신뢰도",
  "추정근거",
  "비고",
  "담당자",
];

function lineToRow(l: EstimateLine): (string | number)[] {
  return [
    l.settlementType,
    l.advertiserName,
    l.brandName,
    l.campaignName,
    l.jobTypeName,
    l.jobCode,
    l.jobName,
    l.accountingMonth,
    l.gmv,
    l.revenue,
    l.isRevenueManual ? "Y" : "N",
    l.cost,
    l.profit,
    l.expectedMarginRate,
    Number(l.actualMarginRate.toFixed(1)),
    l.calculationType,
    l.estimateStatus,
    l.confidenceLevel,
    l.basisNote,
    l.remark,
    l.ownerName,
  ];
}

/**
 * 행 목록 + 요약을 CSV 문자열로 변환한다.
 * 엑셀(한글) 호환을 위해 UTF-8 BOM 을 붙인다.
 */
export function buildCsv(
  lines: EstimateLine[],
  summary: EstimateSummary,
): string {
  const rows: string[] = [];
  rows.push(LINE_HEADERS.map(cell).join(","));
  for (const l of lines) {
    rows.push(lineToRow(l).map(cell).join(","));
  }
  // 요약 블록
  rows.push("");
  rows.push(["합계", "", "", "", "", "", "", "", summary.totalGmv, summary.totalRevenue, "", "", summary.totalProfit, "", Number(summary.marginRate.toFixed(1))].map(cell).join(","));

  return "﻿" + rows.join("\r\n");
}
