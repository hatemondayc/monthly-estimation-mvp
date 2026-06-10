import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { createLine, getLines } from "@/lib/data";
import type { NewLineInput } from "@/lib/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get("versionId") ?? undefined;
  const lines = await getLines(versionId);
  return NextResponse.json({ lines });
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const input = (await req.json()) as NewLineInput;
  const line = await createLine(input);
  return NextResponse.json({ line }, { status: 201 });
}
