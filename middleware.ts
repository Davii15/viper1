import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // ✅ More reliable session checking for mobile
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    // ✅ Add mobile debugging (remove in production)
    const userAgent = req.headers.get("user-agent") || ""
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)

    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 Middleware - ${isMobile ? "Mobile" : "Desktop"} - Session:`, session ? "EXISTS" : "NULL")
      if (error) console.log("❌ Session error:", error)
    }

    // Protected routes
    const protectedPaths = ["/dashboard", "/profile", "/create", "/settings"]
    const isProtectedRoute = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))

    // ✅ Protect routes - redirect if no session
    if (isProtectedRoute && !session) {
      const signInUrl = new URL("/auth/signin", req.url)
      // ✅ Add return URL for better UX
      signInUrl.searchParams.set("returnUrl", req.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // ✅ Redirect authenticated users away from auth pages
    if (req.nextUrl.pathname.startsWith("/auth/") && session) {
      // ✅ Check for return URL
      const returnUrl = req.nextUrl.searchParams.get("returnUrl")
      const redirectUrl = returnUrl && returnUrl !== "/auth/signin" ? returnUrl : "/dashboard"
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    // ✅ Redirect authenticated users from home to dashboard
    if (req.nextUrl.pathname === "/" && session) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res
  } catch (error) {
    // ✅ Handle middleware errors gracefully
    console.error("❌ Middleware error:", error)

    // ✅ For protected routes, redirect to sign-in on error
    const protectedPaths = ["/dashboard", "/profile", "/create", "/settings"]
    const isProtectedRoute = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))

    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    return res
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
