"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, isAuthenticated } from "@/lib/auth"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user is already authenticated
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const authenticated = await isAuthenticated()
        if (authenticated) {
          console.log("✅ User already authenticated, redirecting...")
          const returnUrl = searchParams.get("returnUrl") || "/dashboard"
          router.replace(returnUrl)
          return
        }
      } catch (error) {
        console.log("No existing session found")
      } finally {
        setCheckingSession(false)
      }
    }

    checkExistingSession()
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("🚀 Attempting sign in...")
      const result = await signIn(email, password)
      console.log("✅ Login successful:", result)

      // ✅ Get return URL or default to dashboard
      const returnUrl = searchParams.get("returnUrl") || "/dashboard"
      console.log("🔄 Redirecting to:", returnUrl)

      // ✅ Force page reload and redirect - more reliable for mobile
      window.location.href = returnUrl
    } catch (err: any) {
      console.error("❌ Sign in failed:", err)
      setError(err.message || "Failed to sign in. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking existing session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Checking authentication...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
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
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
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
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 hover:from-orange-600 hover:via-red-600 hover:to-purple-700 text-white py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
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
                <Button variant="outline" className="w-full bg-transparent hover:bg-gray-50">
                  Jisajili - Sign Up
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
