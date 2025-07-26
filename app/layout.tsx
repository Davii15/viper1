import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
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
  // ✅ Setup Supabase server client with proper SSR
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("Session in layout:", session?.user?.email || "No session") // ✅ Better logging

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
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
