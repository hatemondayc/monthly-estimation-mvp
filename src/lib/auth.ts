// 간단한 접근 제한 (PRD §11.1). 임시 패스코드 방식.
// 추후 Supabase Auth / Creator Commerce OS 권한 체계로 교체 가능하게 분리한다.

import { cookies } from "next/headers";

const COOKIE_NAME = "me_auth";
const COOKIE_VALUE = "ok";

function expectedPasscode(): string {
  return process.env.APP_PASSCODE ?? "estimation-2026";
}

/** 입력 패스코드 검증. */
export function verifyPasscode(input: string): boolean {
  return input.trim() === expectedPasscode();
}

/** 로그인 성공 시 호출 — 세션 쿠키를 굽는다. */
export async function setAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8시간
  });
}

/** 로그아웃 — 쿠키 제거. */
export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** 현재 요청이 인증되었는지. (서버 컴포넌트/라우트에서 사용) */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}
