import { NextResponse } from "next/server";

import { clearAuthCookie, setAuthCookie, verifyPasscode } from "@/lib/auth";

/** 로그인: 패스코드 검증 후 세션 쿠키 발급. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { passcode?: string };
  if (!body.passcode || !verifyPasscode(body.passcode)) {
    return NextResponse.json({ ok: false, error: "패스코드가 올바르지 않습니다." }, { status: 401 });
  }
  await setAuthCookie();
  return NextResponse.json({ ok: true });
}

/** 로그아웃. */
export async function DELETE() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
