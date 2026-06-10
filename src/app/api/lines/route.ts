import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { createLine, getLines } from "@/lib/data";
import { validateNumericFields } from "@/lib/validation";
import type { NewLineInput } from "@/lib/data";

const NUMERIC_FIELDS = [
  "gmv",
  "revenue",
  "cost",
  "profit",
  "expectedMarginRate",
  "actualMarginRate",
] as const;

export async function GET(req: Request) {
  // Fix 6: GET에도 인증 확인 — 미인증 요청이 전체 행 목록을 읽어가지 못하게 한다.
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get("versionId") ?? undefined;
  const lines = await getLines(versionId);
  return NextResponse.json({ lines });
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Record<string, unknown>;

  const badField = validateNumericFields(body, NUMERIC_FIELDS);
  if (badField) {
    return NextResponse.json(
      { error: `${badField} must be a finite number` },
      { status: 400 },
    );
  }

  const input = body as unknown as NewLineInput;
  const line = await createLine(input);
  return NextResponse.json({ line }, { status: 201 });
}
