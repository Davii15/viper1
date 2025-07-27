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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // ✅ Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/profile", "/create", "/settings"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // ✅ Auth routes that should redirect if already authenticated
  const authRoutes = ["/auth/signin", "/auth/signup", "/auth/verify-email"]
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // ✅ NEVER redirect from callback - this is crucial!
  const isCallbackRoute = pathname.startsWith("/auth/callback")

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    console.log("🔒 Redirecting unauthenticated user to signin")
    url.pathname = "/auth/signin"
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth routes (except callback)
  if (user && isAuthRoute && !isCallbackRoute) {
    console.log("✅ Redirecting authenticated user to dashboard")
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Allow all other routes (including callback)
  return supabaseResponse
}
