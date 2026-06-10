import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { createVersion, getVersions } from "@/lib/data";
import type { NewVersionInput } from "@/lib/data";

export async function GET() {
  const versions = await getVersions();
  return NextResponse.json({ versions });
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const input = (await req.json()) as NewVersionInput;
  const version = await createVersion(input);
  return NextResponse.json({ version }, { status: 201 });
}
