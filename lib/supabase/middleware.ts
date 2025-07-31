import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    // ✅ Reduced timeout to prevent hanging
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 2000)) // Reduced from 3000ms

    const {
      data: { user },
    } = (await Promise.race([authPromise, timeoutPromise])) as any

    const url = request.nextUrl.clone()
    const pathname = url.pathname

    console.log(`🔄 Middleware: ${pathname} - User: ${user ? user.email : "none"}`)

    // ✅ Protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/profile", "/create", "/settings", "/chat", "/explore"]
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

    // ✅ Auth routes that should redirect if already authenticated
    const authRoutes = ["/auth/signin", "/auth/signup", "/auth/verify-email"]
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    // ✅ NEVER redirect from callback - this is crucial!
    const isCallbackRoute = pathname.startsWith("/auth/callback")

    // ✅ Root route handling
    if (pathname === "/") {
      if (user) {
        console.log("✅ Middleware: Redirecting authenticated user from root to dashboard")
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      } else {
        console.log("🔒 Middleware: Redirecting unauthenticated user from root to signin")
        url.pathname = "/auth/signin"
        return NextResponse.redirect(url)
      }
    }

    // If user is not authenticated and trying to access protected route
    if (!user && isProtectedRoute) {
      console.log("🔒 Middleware: Redirecting unauthenticated user to signin")
      url.pathname = "/auth/signin"
      return NextResponse.redirect(url)
    }

    // ✅ MODIFIED: Be less aggressive with auth route redirects
    // Only redirect if user is authenticated AND not in a callback AND not currently signing in
    if (user && isAuthRoute && !isCallbackRoute) {
      // ✅ Add a small delay check to avoid race conditions during sign-in
      const userAgent = request.headers.get("user-agent") || ""
      const isLikelyBrowser = userAgent.includes("Mozilla")

      if (isLikelyBrowser && pathname === "/auth/signin") {
        // ✅ For sign-in page, be more cautious about redirecting
        // Let the client-side handle the redirect to avoid race conditions
        console.log("⚠️ Middleware: User authenticated on signin page, letting client handle redirect")
        return supabaseResponse
      } else {
        console.log("✅ Middleware: Redirecting authenticated user to dashboard")
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }

    // Allow all other routes (including callback)
    return supabaseResponse
  } catch (error) {
    console.error("❌ Middleware: Auth check failed:", error)

    // ✅ On auth failure, allow the request to continue
    // Let the client-side handle auth state
    return supabaseResponse
  }
}
