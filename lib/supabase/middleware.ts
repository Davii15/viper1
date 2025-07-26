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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // ✅ Mobile-friendly cookie settings
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              httpOnly: false, // Allow client-side access for mobile apps
            }),
          )
        },
      },
    },
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // ✅ Add mobile debugging
    const userAgent = request.headers.get("user-agent") || ""
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)

    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 Middleware - ${isMobile ? "Mobile" : "Desktop"} - User:`, user ? user.email : "NULL")
      if (error) console.log("❌ Auth error:", error)
    }

    // Protected routes
    const protectedPaths = ["/dashboard", "/profile", "/create", "/settings"]
    const authPaths = ["/auth/signin", "/auth/signup", "/auth/forgot-password"]
    const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))
    const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

    // ✅ Redirect unauthenticated users to signin
    if (isProtectedPath && !user) {
      const signInUrl = new URL("/auth/signin", request.url)
      // Add return URL for better UX
      signInUrl.searchParams.set("returnUrl", request.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // ✅ Redirect authenticated users away from auth pages
    if (isAuthPath && user) {
      // Check for return URL
      const returnUrl = request.nextUrl.searchParams.get("returnUrl")
      const redirectUrl = returnUrl && returnUrl !== "/auth/signin" ? returnUrl : "/dashboard"
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // ✅ Redirect authenticated users from home to dashboard
    if (request.nextUrl.pathname === "/" && user) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return supabaseResponse
  } catch (error) {
    // ✅ Handle middleware errors gracefully
    console.error("❌ Middleware error:", error)

    // For protected routes, redirect to sign-in on error
    const protectedPaths = ["/dashboard", "/profile", "/create", "/settings"]
    const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

    if (isProtectedPath) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    return supabaseResponse
  }
}
