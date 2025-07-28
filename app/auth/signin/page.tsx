"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Globe, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // ✅ Redirect if already authenticated
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

    // ✅ Client-side validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }

    try {
      console.log("🔐 Starting sign in...")

      // ✅ Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      })

      if (error) {
        console.error("❌ Sign in error:", error)
        throw error
      }

      if (!data.user) {
        throw new Error("Authentication failed - no user data")
      }

      console.log("✅ Sign in successful for:", data.user.email)

      // ✅ The AuthProvider will handle the rest automatically
      // Just redirect to dashboard
      router.replace("/dashboard")
    } catch (err: any) {
      console.error("❌ Sign in error:", err)

      // ✅ Better error handling
      let errorMessage = "Failed to sign in"

      if (err.message?.includes("Invalid login credentials") || err.message?.includes("invalid_credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials and try again."
      } else if (err.message?.includes("Email not confirmed") || err.message?.includes("email_not_confirmed")) {
        errorMessage = "Please verify your email address before signing in. Check your inbox for the verification link."
      } else if (err.message?.includes("Too many requests") || err.message?.includes("rate_limit")) {
        errorMessage = "Too many sign in attempts. Please wait a moment and try again."
      } else if (err.message?.includes("network") || err.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again."
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // ✅ Clear error when user starts typing
    if (error) setError("")
  }

  // ✅ Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // ✅ Don't render if user is authenticated (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
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
              <span className="text-2xl">🌟</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Karibu Tena!
            </CardTitle>
            <p className="text-gray-600 mt-2">Access your global Ubuntu account</p>
            <div className="bg-green-50 p-3 rounded-lg mt-4">
              <p className="text-green-800 text-sm font-medium">🌍 Sign in from ANY device, ANYWHERE!</p>
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
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
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
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 hover:from-orange-600 hover:via-red-600 hover:to-purple-700 text-white py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Ingia - Access Global Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🌍 Global Access Features:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • <CheckCircle className="w-3 h-3 inline mr-1" /> Access from any device worldwide
                </li>
                <li>
                  • <CheckCircle className="w-3 h-3 inline mr-1" /> Write blogs from internet cafes
                </li>
                <li>
                  • <CheckCircle className="w-3 h-3 inline mr-1" /> No device dependency
                </li>
                <li>
                  • <CheckCircle className="w-3 h-3 inline mr-1" /> Cloud-stored content
                </li>
              </ul>
            </div>

            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Don't have a global account?</span>
                </div>
              </div>

              <Link href="/auth/signup" className="mt-4 block">
                <Button variant="outline" className="w-full bg-transparent" disabled={loading}>
                  <Globe className="w-4 h-4 mr-2" />
                  Jisajili - Create Global Account
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <Link href="/auth/forgot-password" className="text-sm text-gray-600 hover:text-orange-600">
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
