"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Summary" },
  { href: "/estimates", label: "추정 입력" },
  { href: "/compare", label: "버전 비교" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  // 로그인 화면에서는 내비게이션 숨김
  if (pathname.startsWith("/login")) return null;

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-800">월별 실적 추정</span>
          <nav className="flex gap-1">
            {LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded px-3 py-1.5 text-sm ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={logout}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
