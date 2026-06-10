import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 접근 제한 (PRD §11.1). 인증 쿠키가 없으면 /login 으로 보낸다.
// /login, /api/auth, 정적 자원은 예외.

const PUBLIC_PATHS = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const authed = req.cookies.get("me_auth")?.value === "ok";
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // _next 정적 파일, 파비콘 등은 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
