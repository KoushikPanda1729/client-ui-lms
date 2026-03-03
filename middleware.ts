import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/partners", "/courses", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Check auth — accessToken is an httpOnly cookie set by backend
  const token = request.cookies.get("accessToken")?.value;
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Check onboarding — 'onb' is a readable cookie we set from the frontend
  const onboardingDone = request.cookies.get("onb")?.value === "1";
  if (!onboardingDone) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/partners/:path*", "/courses/:path*", "/settings/:path*"],
};
