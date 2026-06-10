import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { deleteVersion, updateVersion } from "@/lib/data";
import type { EstimateVersion } from "@/types/estimate";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const patch = (await req.json()) as Partial<EstimateVersion>;
  const version = await updateVersion(id, patch);
  if (!version) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ version });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteVersion(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
