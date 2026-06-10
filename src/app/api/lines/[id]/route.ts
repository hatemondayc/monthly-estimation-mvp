import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { deleteLine, updateLine } from "@/lib/data";
import { LINE_NUMERIC_FIELDS, validateNumericFields } from "@/lib/validation";
import type { EstimateLine } from "@/types/estimate";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const badField = validateNumericFields(body, LINE_NUMERIC_FIELDS);
  if (badField) {
    return NextResponse.json(
      { error: `${badField} must be a finite number` },
      { status: 400 },
    );
  }

  const patch = body as Partial<EstimateLine>;
  const line = await updateLine(id, patch);
  if (!line) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ line });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteLine(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
