"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, User, Globe, ArrowRight, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth"
import { useAuth } from "@/components/auth-provider"

const africanCountries = [
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cameroon",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo",
  "Democratic Republic of Congo",
  "Djibouti",
  "Egypt",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Ivory Coast",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Nigeria",
  "Rwanda",
  "São Tomé and Príncipe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Sudan",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "Zambia",
  "Zimbabwe",
]

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    country: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // ✅ Redirect authenticated users - let middleware handle this primarily
  useEffect(() => {
    if (!authLoading && user) {
      console.log("✅ User already authenticated, redirecting to dashboard")
      router.replace("/dashboard")
    }
  }, [user, authLoading, router])

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName || !formData.username) {
      setError("Please fill in all required fields")
      return false
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address")
      return false
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      return false
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters")
      return false
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      console.log("🔄 Starting sign up process...")

      const data = await signUp(formData.email, formData.password, {
        username: formData.username.toLowerCase().trim(),
        full_name: formData.fullName.trim(),
        country: formData.country || null,
      })

      if (!data.user) {
        throw new Error("No user data received")
      }

      console.log("✅ Sign up successful for:", data.user.email)

      setSuccess(true)
      setError("")

      // ✅ Redirect to verification page
      setTimeout(() => {
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
      }, 2000)
    } catch (err: any) {
      console.error("❌ Sign up error:", err)

      let errorMessage = "Failed to create account"

      if (err.message?.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead."
      } else if (err.message?.includes("already_registered") || err.message?.includes("already exists")) {
        errorMessage = "An account with this email already exists. Please sign in instead."
      } else if (err.message?.includes("invalid_email")) {
        errorMessage = "Please enter a valid email address."
      } else if (err.message?.includes("weak_password")) {
        errorMessage = "Password is too weak. Please choose a stronger password."
      } else if (err.message?.includes("rate_limit") || err.message?.includes("too_many_requests")) {
        errorMessage = "Too many attempts. Please wait a moment and try again."
      } else if (err.message?.includes("network") || err.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again."
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
    if (error) setError("")
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

  // ✅ Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl animate-pulse">🎉</div>
          <div className="absolute top-20 right-20 text-4xl animate-bounce">✨</div>
          <div className="absolute bottom-20 left-20 text-5xl animate-pulse">🌍</div>
          <div className="absolute bottom-10 right-10 text-4xl animate-bounce">📧</div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">Account Created! 🎉</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Karibu Posti! We've sent a verification email to <strong>{formData.email}</strong>
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm font-medium">📧 Check your email now!</p>
                <p className="text-blue-600 text-xs mt-1">
                  Click the verification link to activate your global Ubuntu account
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm">Redirecting to verification page...</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
              Karibu Posti!
            </CardTitle>
            <p className="text-gray-600 mt-2">Join the African storytelling community</p>
            <div className="bg-green-50 p-3 rounded-lg mt-4 border border-green-200">
              <p className="text-green-800 text-sm font-medium">🌍 Create your global Ubuntu account!</p>
              <p className="text-green-600 text-xs mt-1">Access your stories from anywhere in the world</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="pl-10 h-12"
                      required
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value.toLowerCase())}
                    className="h-12"
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 h-12"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country (Optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleInputChange("country", value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="pl-10 h-12">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {africanCountries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                    disabled={loading}
                    autoComplete="new-password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    disabled={loading}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Jisajili - Create Global Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have a global account?</span>
                </div>
              </div>

              <Link href="/auth/signin" className="mt-4 block">
                <Button
                  variant="outline"
                  className="w-full bg-transparent hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 h-12"
                  disabled={loading}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Ingia - Sign In
                </Button>
              </Link>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-orange-800 text-xs font-medium">💡 Pro Tip:</p>
              <p className="text-orange-600 text-xs mt-1">
                After verification, you can access Posti from any device - your laptop, phone, or even internet cafes!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
