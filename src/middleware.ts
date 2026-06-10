import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 접근 제한 (PRD §11.1). 인증 쿠키가 없으면 페이지는 /login으로, API는 401로 응답한다.
// /login, /api/auth, 정적 자원은 예외.

const PUBLIC_PATHS = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const authed = req.cookies.get("me_auth")?.value === "ok";
  if (!authed) {
    // API 클라이언트(fetch)에는 307 리다이렉트 대신 401 JSON을 반환한다.
    // 307로 리다이렉트하면 fetch가 /login HTML을 200으로 받아 res.ok===true가 되고
    // res.json()에서 SyntaxError가 발생해 사용자에게 오류 피드백이 없어진다.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
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
