import { isAuthenticated } from "@/lib/auth";
import { getLines, getSummary, getVersion } from "@/lib/data";
import { buildCsv } from "@/lib/csv";

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

  const [lines, summary] = await Promise.all([
    getLines(versionId),
    getSummary(versionId),
  ]);
  const csv = buildCsv(lines, summary);

  const filename = `estimate_${version.yearMonth}_${version.roundType}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
