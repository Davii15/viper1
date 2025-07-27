"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Loader2, ArrowRight, Globe } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { createUserProfile } from "@/lib/auth"

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying your email...")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    handleAuthCallback()
  }, [searchParams])

  const handleAuthCallback = async () => {
    try {
      console.log("🔄 Starting cloud-based auth callback...")

      const code = searchParams.get("code")
      const error = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")

      // ✅ Check for errors first
      if (error) {
        console.error("❌ Auth callback error:", error, errorDescription)
        throw new Error(errorDescription || error)
      }

      if (!code) {
        console.error("❌ No verification code found")
        throw new Error("No verification code found. Please try signing up again.")
      }

      console.log("🔄 Processing verification code...")
      setMessage("Processing verification code...")

      // ✅ Exchange code for session with cloud verification
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.error("❌ Session exchange error:", sessionError)
        throw sessionError
      }

      if (!sessionData?.user) {
        throw new Error("No user data received after verification")
      }

      console.log("✅ Email verified successfully for:", sessionData.user.email)

      // ✅ Create/update user profile in cloud database
      setMessage("Setting up your global account...")
      await handleUserProfileCreation(sessionData.user)

      setStatus("success")
      setMessage("Karibu Posti! Your global account is ready! 🌍")

      // ✅ Redirect to dashboard
      setTimeout(() => {
        console.log("🚀 Redirecting to dashboard...")
        router.replace("/dashboard")
      }, 3000)
    } catch (error: any) {
      console.error("❌ Auth callback error:", error)
      setStatus("error")

      // ✅ Better error messages
      let errorMessage = "Verification failed. Please try again."

      if (error.message?.includes("expired")) {
        errorMessage = "Verification link has expired. Please request a new one."
      } else if (error.message?.includes("invalid")) {
        errorMessage = "Invalid verification link. Please sign up again."
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error.message?.includes("already_confirmed")) {
        errorMessage = "Email already verified. You can sign in now."
      } else if (error.message) {
        errorMessage = error.message
      }

      setMessage(errorMessage)
    }
  }

  // ✅ Handle user profile creation in cloud database
  const handleUserProfileCreation = async (user: any) => {
    try {
      console.log("👤 Creating/updating user profile in cloud database...")

      // ✅ Check if profile already exists
      const { data: existingProfile } = await supabase.from("users").select("id, verified").eq("id", user.id).single()

      if (existingProfile) {
        // ✅ Update existing profile to mark as verified
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
          console.log("✅ User profile updated in cloud database")
        }
        return
      }

      // ✅ Create new profile in cloud database
      const profileData = {
        email: user.email,
        username: user.user_metadata.username || user.email.split("@")[0],
        full_name: user.user_metadata.full_name || "User",
        country: user.user_metadata.country || null,
        avatar_url: user.user_metadata.avatar_url || null,
      }

      await createUserProfile(user.id, profileData)
      console.log("✅ User profile created in cloud database")
    } catch (error) {
      console.error("❌ Profile creation error:", error)
      // Don't throw error here - user is verified, profile creation is secondary
      console.warn("⚠️ Continuing without profile creation...")
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
              {status === "error" && "Verification Failed"}
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
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800 text-sm">{message}</p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => router.replace("/auth/signup")}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Create Global Account
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.replace("/auth/signin")}
                    className="w-full bg-transparent hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Try Signing In
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
