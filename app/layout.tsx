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
  // ✅ Get server-side session and user data
  let initialSession = null
  let initialUser = null

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ Layout: Session error:", sessionError)
    } else if (session?.user) {
      console.log("✅ Layout: Server session found for:", session.user.email)
      initialSession = session

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
      } else {
        console.log("✅ Layout: User profile loaded:", profile.email)
        initialUser = profile
      }
    } else {
      console.log("ℹ️ Layout: No server session found")
    }
  } catch (error) {
    console.error("❌ Layout: Server auth check failed:", error)
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
