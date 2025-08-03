"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Globe, Loader2 } from "lucide-react"
import Link from "next/link"
import { signIn } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // ✅ Let middleware handle redirects primarily, but add client-side backup
  useEffect(() => {
    if (!authLoading && user) {
      console.log("✅ User already authenticated, redirecting to dashboard")
      router.replace("/dashboard")
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("🔄 Starting sign in process...")

      const data = await signIn(email, password)

      if (!data.user) {
        throw new Error("No user data received")
      }

      console.log("✅ Sign in successful for:", data.user.email)

      // ✅ Let auth provider handle the redirect
      // The auth state change will trigger navigation
    } catch (err: any) {
      console.error("❌ Sign in error:", err)

      let errorMessage = "Failed to sign in"

      if (err.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials."
      } else if (err.message?.includes("Email not confirmed")) {
        errorMessage = "Please verify your email address before signing in."
      } else if (err.message?.includes("Too many requests") || err.message?.includes("rate_limit")) {
        errorMessage = "Too many sign-in attempts. Please wait a moment and try again."
      } else if (err.message?.includes("network") || err.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (err.message?.includes("User not found")) {
        errorMessage = "No account found with this email. Please sign up first."
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Don't render if user is authenticated (will redirect)
  if (user) {
    return null
  }

  // ✅ Show minimal loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl animate-pulse">🌍</div>
        <div className="absolute top-20 right-20 text-4xl animate-bounce">🦁</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-pulse">🌴</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-bounce">🐘</div>
        <div className="absolute top-1/2 left-1/4 text-3xl animate-pulse">🦒</div>
        <div className="absolute top-1/3 right-1/3 text-3xl animate-bounce">🌺</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">✨</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Karibu Tena!
            </CardTitle>
            <p className="text-gray-600 mt-2">Welcome back to Posti</p>
            <div className="bg-blue-50 p-3 rounded-lg mt-4 border border-blue-200">
              <p className="text-blue-800 text-sm font-medium">🌍 Access your global Ubuntu account</p>
              <p className="text-blue-600 text-xs mt-1">Sign in from anywhere in the world</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 hover:from-orange-600 hover:via-red-600 hover:to-purple-700 text-white py-3 h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Ingia - Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot your password?
              </Link>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
                </div>
              </div>

              <Link href="/auth/signup">
                <Button
                  variant="outline"
                  className="w-full bg-transparent hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 h-12"
                  disabled={loading}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Jisajili - Sign Up
                </Button>
              </Link>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-green-800 text-xs font-medium">🌍 Global Access:</p>
              <p className="text-green-600 text-xs mt-1">
                Your Ubuntu account works on any device, anywhere in the world!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
