import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

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
    url: "https://posti-phi.vercel.app",
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Posti" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="email=no" />
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function setVH() {
                let vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', vh + 'px');
              }
              setVH();
              window.addEventListener('resize', setVH);
              window.addEventListener('orientationchange', setVH);
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
