import { isAuthenticated } from "@/lib/auth";
import { getLines, getVersion } from "@/lib/data";
import { summarize } from "@/lib/calculations";
import { buildCsv } from "@/lib/csv";
import { SETTLEMENT_TYPES } from "@/types/estimate";
import type { SettlementType } from "@/types/estimate";

/** 월/버전 단위 CSV 다운로드 (PRD §11.5). ?versionId= 필수. */
export async function GET(req: Request) {
  // Fix 6: 인증 확인 — 미인증 요청이 원장 데이터를 CSV로 내보내지 못하게 한다.
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get("versionId");
  if (!versionId) {
    return new Response("versionId required", { status: 400 });
  }

  const version = await getVersion(versionId);
  if (!version) {
    return new Response("version not found", { status: 404 });
  }

  // 선택된 월/정산구분 탭 기준으로 필터 (둘 다 선택 시에만 적용).
  const monthParam = searchParams.get("accountingMonth");
  const settlementParam = searchParams.get("settlementType");
  const settlement = SETTLEMENT_TYPES.includes(settlementParam as SettlementType)
    ? (settlementParam as SettlementType)
    : null;

  const allLines = await getLines(versionId);
  const lines = allLines.filter(
    (l) =>
      (!monthParam || l.accountingMonth === monthParam) &&
      (!settlement || l.settlementType === settlement),
  );
  // 합계는 필터된 행 기준으로 재계산 — csv.ts 합계행 오프셋은 그대로 유지된다.
  const summary = summarize(lines);
  const csv = buildCsv(lines, summary);

  // 파일명은 ASCII만 — Content-Disposition 헤더는 ByteString(≤255)이라 한글이 들어가면 throw된다.
  const monthTag = monthParam ? `_${monthParam}` : "";
  const settlementTag = settlement
    ? `_${settlement === "제작" ? "production" : "media"}`
    : "";
  const filename = `estimate_${version.yearMonth}_${version.roundType}${monthTag}${settlementTag}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
