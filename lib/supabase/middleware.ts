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
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedPaths = ["/dashboard", "/profile", "/create", "/settings"]
  const authPaths = ["/auth/signin", "/auth/signup", "/auth/forgot-password"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Redirect unauthenticated users to signin
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL("/auth/signin", request.url))
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect authenticated users from home to dashboard
  if (request.nextUrl.pathname === "/" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}
