// 숫자/통화/퍼센트 포맷 유틸 (PRD §14 Step 2).

/** 천단위 콤마 정수. (원 단위 금액 표시용) */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("ko-KR");
}

/** 이익률 등 퍼센트. 소수 1자리. */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

/** 증감 표시(+/-)가 붙는 정수. */
export function formatDelta(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toLocaleString("ko-KR")}`;
}

/** 증감률 표시(+/-)가 붙는 퍼센트. */
export function formatDeltaPercent(value: number): string {
  if (!Number.isFinite(value)) return "0.0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/** 저장 포맷 `YYYY-MM` 유효성 검사. 탭 오염 방지에 사용. */
export function isValidMonth(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value);
}

/**
 * 회계기간 표시용 포맷. 저장값 `YYYY-MM`을 엑셀 표기 `YYYY.MM`로 보여준다.
 * 저장 포맷은 그대로 유지하고 표시에만 사용한다. 형식이 다르면 원본을 반환.
 */
export function formatAccountingMonth(value: string): string {
  if (isValidMonth(value)) return value.replace("-", ".");
  return value;
}

/**
 * 문자열 입력을 숫자로 정규화한다.
 * 콤마/공백/원화기호를 제거하고, 빈 값은 0으로 처리한다.
 */
export function parseNumberInput(raw: string): number {
  if (raw == null) return 0;
  const cleaned = String(raw).replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
