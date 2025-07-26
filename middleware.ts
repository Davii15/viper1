import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // ✅ Skip middleware entirely for auth pages to prevent loops
  if (req.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const isProtectedPage = ["/dashboard", "/profile", "/create", "/settings"].some((path) =>
      req.nextUrl.pathname.startsWith(path),
    )

    // ✅ Only redirect if no session AND trying to access protected page
    if (isProtectedPage && !session) {
      console.log("❌ No session found, redirecting to signin")
      const signInUrl = new URL("/auth/signin", req.url)
      signInUrl.searchParams.set("returnUrl", req.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // ✅ Redirect authenticated users from home to dashboard
    if (req.nextUrl.pathname === "/" && session) {
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
