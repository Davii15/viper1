import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
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

    // ✅ Redirect unauthenticated users from protected pages
    if (isProtectedPage && !session) {
      const signInUrl = new URL("/auth/signin", req.url)
      signInUrl.searchParams.set("returnUrl", req.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // ✅ Redirect authenticated users away from auth pages
    if (isAuthPage && session && !req.nextUrl.pathname.includes("/callback")) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // ✅ Redirect authenticated users from home to dashboard
    if (req.nextUrl.pathname === "/" && session) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res
  } catch (error) {
    console.error("❌ Middleware error:", error)
    return res
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
