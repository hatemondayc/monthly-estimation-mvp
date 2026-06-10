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

// 테이블 컬럼 순서와 동일하게 정렬 (엑셀 정합성).
const LINE_HEADERS = [
  "회계기간",
  "정산구분",
  "광고주",
  "브랜드",
  "캠페인번호",
  "캠페인명",
  "JOB유형",
  "JOB번호",
  "JOB명",
  "담당자",
  "계산방식",
  "취급고",
  "매출액",
  "매출액수동",
  "매출원가",
  "매출이익",
  "예상이익률",
  "실적이익률",
  "상태",
  "추정근거",
  "비고",
];

function lineToRow(l: EstimateLine): (string | number)[] {
  return [
    l.accountingMonth,
    l.settlementType,
    l.advertiserName,
    l.brandName,
    l.campaignCode,
    l.campaignName,
    l.jobTypeName,
    l.jobCode,
    l.jobName,
    l.ownerName,
    l.calculationType,
    l.gmv,
    l.revenue,
    l.isRevenueManual ? "Y" : "N",
    l.cost,
    l.profit,
    l.expectedMarginRate,
    Number(l.actualMarginRate.toFixed(1)),
    l.estimateStatus,
    l.basisNote,
    l.remark,
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
  // 요약 블록 (헤더 순서 기준: 취급고=11, 매출액=12, 매출이익=15, 실적이익률=17)
  rows.push("");
  const summaryRow: (string | number)[] = new Array(LINE_HEADERS.length).fill("");
  summaryRow[0] = "합계";
  summaryRow[11] = summary.totalGmv;
  summaryRow[12] = summary.totalRevenue;
  summaryRow[15] = summary.totalProfit;
  summaryRow[17] = Number(summary.marginRate.toFixed(1));
  rows.push(summaryRow.map(cell).join(","));

  return "﻿" + rows.join("\r\n");
}
