import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    const url = request.nextUrl.clone()
    const pathname = url.pathname

    // ✅ NEVER interfere with callback routes
    if (pathname.startsWith("/auth/callback")) {
      console.log("🔄 Middleware: Allowing callback route")
      return supabaseResponse
    }

    // ✅ Quick auth check with timeout
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 5000), // Increased timeout
    )

    const {
      data: { user },
    } = (await Promise.race([authPromise, timeoutPromise])) as any

    console.log(`🔄 Middleware: ${pathname} - User: ${user ? user.email : "none"}`)

    // ✅ Protected routes
    const protectedRoutes = ["/dashboard", "/profile", "/create", "/settings", "/chat", "/explore"]
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

    // ✅ Auth routes
    const authRoutes = ["/auth/signin", "/auth/signup", "/auth/verify-email"]
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    // ✅ Root route handling
    if (pathname === "/") {
      if (user) {
        console.log("✅ Middleware: Redirecting authenticated user to dashboard")
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      } else {
        console.log("🔒 Middleware: Redirecting unauthenticated user to signin")
        url.pathname = "/auth/signin"
        return NextResponse.redirect(url)
      }
    }

    // ✅ Protect routes that require authentication
    if (!user && isProtectedRoute) {
      console.log("🔒 Middleware: Redirecting to signin")
      url.pathname = "/auth/signin"
      return NextResponse.redirect(url)
    }

    // ✅ Redirect authenticated users away from auth pages (except verify-email)
    if (user && isAuthRoute && pathname !== "/auth/verify-email") {
      console.log("✅ Middleware: Redirecting authenticated user to dashboard")
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("❌ Middleware: Auth check failed:", error)
    // ✅ On error, allow request to continue
    return supabaseResponse
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
