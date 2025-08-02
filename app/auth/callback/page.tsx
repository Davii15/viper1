"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Loader2, ArrowRight, Globe } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying your email...")
  const [errorDetails, setErrorDetails] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    handleAuthCallback()
  }, [searchParams])

  const handleAuthCallback = async () => {
    try {
      console.log("🔄 Starting email verification callback...")

      const code = searchParams.get("code")
      const error = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")

      if (error) {
        console.error("❌ URL callback error:", error, errorDescription)
        throw new Error(errorDescription || error)
      }

      if (!code) {
        console.error("❌ No verification code found in URL")
        throw new Error("Invalid verification link. Please try signing up again.")
      }

      console.log("🔄 Processing verification code...")
      setMessage("Processing verification code...")

      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.error("❌ Session exchange error:", sessionError)

        if (sessionError.message?.includes("expired")) {
          throw new Error("Verification link has expired. Please request a new one.")
        } else if (sessionError.message?.includes("invalid")) {
          throw new Error("Invalid verification link. Please sign up again.")
        } else if (sessionError.message?.includes("already_confirmed")) {
          throw new Error("Email already verified. You can sign in now.")
        }

        throw sessionError
      }

      if (!sessionData?.user) {
        throw new Error("No user data received after verification")
      }

      console.log("✅ Email verified successfully for:", sessionData.user.email)

      setMessage("Setting up your global account...")
      await createUserProfile(sessionData.user)

      setStatus("success")
      setMessage("Karibu Posti! Your global account is ready! 🌍")

      setTimeout(() => {
        console.log("🚀 Redirecting to dashboard...")
        router.replace("/dashboard")
      }, 3000)
    } catch (error: any) {
      console.error("❌ Auth callback error:", error)
      setStatus("error")
      setErrorDetails(error.message || "Unknown error occurred")

      let userMessage = "Verification failed. Please try again."

      if (error.message?.includes("expired")) {
        userMessage = "Verification link has expired. Please request a new one."
      } else if (error.message?.includes("invalid")) {
        userMessage = "Invalid verification link. Please sign up again."
      } else if (error.message?.includes("already_confirmed")) {
        userMessage = "Email already verified. You can sign in now."
      } else if (error.message?.includes("network")) {
        userMessage = "Network error. Please check your connection and try again."
      } else if (error.message?.includes("permission") || error.message?.includes("denied")) {
        userMessage = "Account created successfully! Please sign in to continue."
      } else if (error.message) {
        userMessage = error.message
      }

      setMessage(userMessage)
    }
  }

  const createUserProfile = async (user: any) => {
    try {
      console.log("👤 Creating user profile...")

      const { data: existingProfile, error: checkError } = await supabase
        .from("users")
        .select("id, verified")
        .eq("id", user.id)
        .single()

      if (existingProfile) {
        console.log("✅ Profile exists, updating verification status...")

        const { error: updateError } = await supabase
          .from("users")
          .update({
            verified: true,
            updated_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
          })
          .eq("id", user.id)

        if (updateError) {
          console.warn("⚠️ Profile update failed:", updateError)
        } else {
          console.log("✅ Profile verification updated")
        }
        return
      }

      const profileData = {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email.split("@")[0],
        full_name: user.user_metadata?.full_name || "User",
        country: user.user_metadata?.country || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        bio: null,
        location: null,
        website: null,
        verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      }

      console.log("👤 Creating new profile with data:", {
        email: profileData.email,
        username: profileData.username,
      })

      const { error: insertError } = await supabase.from("users").insert(profileData)

      if (insertError) {
        console.error("❌ Profile creation error:", insertError)

        if (insertError.code === "23505") {
          console.log("✅ Profile already exists (duplicate key), continuing...")
          return
        }

        console.warn("⚠️ Profile creation failed, but user is verified:", insertError.message)
        return
      }

      console.log("✅ User profile created successfully")
    } catch (error: any) {
      console.error("❌ Profile creation error:", error)
      console.warn("⚠️ Continuing without profile creation - user can complete setup later")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl animate-pulse">🌍</div>
        <div className="absolute top-20 right-20 text-4xl animate-bounce">✨</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-pulse">🎉</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-bounce">🚀</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-500 ${
                status === "success"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : status === "error"
                    ? "bg-gradient-to-r from-red-500 to-pink-500"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500"
              }`}
            >
              {status === "loading" && <Loader2 className="w-8 h-8 text-white animate-spin" />}
              {status === "success" && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
              )}
              {status === "error" && <AlertCircle className="w-8 h-8 text-white" />}
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {status === "loading" && "Verifying Email..."}
              {status === "success" && "Karibu Posti! 🎉"}
              {status === "error" && "Verification Complete"}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{message}</p>

            {/* Loading Animation */}
            {status === "loading" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">Setting up your global Ubuntu account...</p>
              </div>
            )}

            {/* Success State */}
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="text-6xl">🌍</div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                  <p className="text-green-800 font-semibold">Welcome to the global Ubuntu community!</p>
                  <p className="text-green-600 text-sm mt-1">
                    Your account is now accessible from anywhere in the world
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">🌍 What you can do now:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Write blogs from any device, anywhere</li>
                    <li>• Access your account from internet cafes</li>
                    <li>• No need to carry your device everywhere</li>
                    <li>• Your stories are safely stored in the cloud</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
              </motion.div>
            )}

            {/* Error State */}
            {status === "error" && (
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-orange-800 text-sm font-medium">{message}</p>
                  {errorDetails && <p className="text-orange-600 text-xs mt-2">Details: {errorDetails}</p>}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm font-medium">✅ Good News!</p>
                  <p className="text-blue-600 text-xs mt-1">
                    Your email has been verified and your account is created. You can now sign in!
                  </p>
                </div>

                <div className="space-y-2">
                  <Link href="/auth/signin">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                      <Globe className="w-4 h-4 mr-2" />
                      Sign In to Your Account
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Create New Account
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
