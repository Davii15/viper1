import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // ✅ Skip middleware for auth callback to prevent loops
  if (req.nextUrl.pathname === "/auth/callback") {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const isAuthPage = req.nextUrl.pathname.startsWith("/auth/")
    const isProtectedPage = ["/dashboard", "/profile", "/create", "/settings"].some((path) =>
      req.nextUrl.pathname.startsWith(path),
    )

    // ✅ Only redirect if no session AND trying to access protected page
    if (isProtectedPage && !session) {
      const signInUrl = new URL("/auth/signin", req.url)
      signInUrl.searchParams.set("returnUrl", req.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // ✅ Only redirect authenticated users from signin/signup (not callback)
    if ((req.nextUrl.pathname === "/auth/signin" || req.nextUrl.pathname === "/auth/signup") && session) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res
  } catch (error) {
    console.error("❌ Middleware error:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
