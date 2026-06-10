// 코드 패턴 검증 (사용성 개선용). 저장은 절대 차단하지 않고 warning 메시지만 반환한다.
// 기존 회사 엑셀의 캠페인번호/JOB번호 표기와 어긋날 때 입력자에게 힌트를 준다.

const CAMPAIGN_CODE_RE = /^1000-C-\d{2}-\d{4}$/;
const JOB_CODE_RE = /^1000-C-\d{2}-\d{4}\.\d{2}$/;

/** 캠페인번호 경고. 비어 있으면 경고 없음(필수 아님). */
export function campaignCodeWarning(code: string): string | null {
  if (!code) return null;
  if (!CAMPAIGN_CODE_RE.test(code)) return "형식 예: 1000-C-26-0001";
  return null;
}

/**
 * JOB번호 경고. 비어 있으면 경고 없음.
 * 1) 패턴 불일치 검사 2) campaignCode로 시작하는지 검사.
 */
export function jobCodeWarning(jobCode: string, campaignCode: string): string | null {
  if (!jobCode) return null;
  if (!JOB_CODE_RE.test(jobCode)) return "형식 예: 1000-C-26-0001.01";
  if (campaignCode && !jobCode.startsWith(campaignCode)) {
    return "JOB번호가 캠페인번호로 시작하지 않습니다";
  }
  return null;
}
