import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Posti - Where African Stories Come to Life",
  description:
    "The ultimate African platform for creators, writers, and storytellers. Share your passion, connect with your community, and celebrate Ubuntu together.",
  keywords: "African stories, blogging, Ubuntu, storytelling, community, Nigeria, Kenya, Ghana, South Africa",
  authors: [{ name: "Posti Team" }],
  creator: "Posti Platform",
  publisher: "Posti",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://posti.africa",
    title: "Posti - Where African Stories Come to Life",
    description: "The ultimate African platform for creators, writers, and storytellers.",
    siteName: "Posti",
  },
  twitter: {
    card: "summary_large_image",
    title: "Posti - Where African Stories Come to Life",
    description: "The ultimate African platform for creators, writers, and storytellers.",
    creator: "@PostiAfrica",
  },
  generator: "smart_devs",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ Get server-side session and user data with timeout
  let initialSession = null
  let initialUser = null

  try {
    // ✅ Add timeout to server-side auth check
    const authPromise = (async () => {
      const supabase = await createServerSupabaseClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("❌ Layout: Session error:", sessionError)
        return { session: null, user: null }
      }

      if (session?.user) {
        console.log("✅ Layout: Server session found for:", session.user.email)

        // ✅ Get user profile from database
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          if (profileError.code !== "PGRST116") {
            console.error("❌ Layout: Profile fetch error:", profileError)
          }
          return { session, user: null }
        }

        console.log("✅ Layout: User profile loaded:", profile.email)
        return { session, user: profile }
      }

      console.log("ℹ️ Layout: No server session found")
      return { session: null, user: null }
    })()

    // ✅ Race against timeout
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Server auth timeout")), 3000))

    const result = await Promise.race([authPromise, timeoutPromise])
    initialSession = result.session
    initialUser = result.user
  } catch (error) {
    console.error("❌ Layout: Server auth check failed:", error)
    // Continue with null values - client will handle auth
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent ServiceWorker issues in preview environments */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Disable problematic service workers in preview
              if ('serviceWorker' in navigator && window.location.hostname.includes('vusercontent.net')) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
        {/* Email verification meta tags */}
        <meta name="format-detection" content="email=no" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
          <AuthProvider initialSession={initialSession} initialUser={initialUser}>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
