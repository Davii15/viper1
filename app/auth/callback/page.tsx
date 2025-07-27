"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { clearUserCache } from "@/lib/auth"

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying your email...")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔄 Starting auth callback process...")

        const code = searchParams.get("code")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        // Check for errors first
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

        // ✅ Exchange code for session - THIS IS THE VERIFICATION STEP
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

        if (sessionError) {
          console.error("❌ Session exchange error:", sessionError)
          throw sessionError
        }

        if (!data.user) {
          throw new Error("No user data received after verification")
        }

        console.log("✅ Email verified successfully for:", data.user.email)

        // ✅ Create user profile after verification
        await createUserProfileAfterVerification(data.user)

        // ✅ Clear any cached user data to force fresh load
        clearUserCache()

        setStatus("success")
        setMessage("Karibu Posti! Your account is ready! 🌍")

        // ✅ Clean up stored data
        if (typeof window !== "undefined") {
          localStorage.removeItem("pendingUserData")
          localStorage.removeItem("pendingVerificationEmail")
        }

        // 🎯 THIS IS WHERE WE REDIRECT TO DASHBOARD
        setTimeout(() => {
          console.log("🚀 Redirecting to dashboard...")
          window.location.href = "/dashboard"
        }, 2000)
      } catch (error: any) {
        console.error("❌ Auth callback error:", error)
        setStatus("error")
        setMessage(error.message || "Verification failed. Please try again.")
      }
    }

    // Helper function to create user profile
    const createUserProfileAfterVerification = async (user: any) => {
      try {
        // Get stored user data from signup
        const storedUserData = localStorage.getItem("pendingUserData")
        const userData = storedUserData ? JSON.parse(storedUserData) : {}

        console.log("👤 Creating user profile after verification...")

        const { data, error } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email,
            username: userData.username || user.email.split("@")[0],
            full_name: userData.full_name || "User",
            country: userData.country,
            avatar_url: user.user_metadata.avatar_url,
            verified: true, // ✅ Mark as verified since email is confirmed
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
          })
          .select()
          .single()

        if (error && error.code !== "23505") {
          // Ignore duplicate key error (user already exists)
          console.warn("⚠️ Profile creation failed:", error)
        } else {
          console.log("✅ User profile created successfully")
        }
      } catch (error) {
        console.error("Error creating user profile:", error)
      }
    }

    // ✅ Only run if we have search params
    if (searchParams.toString()) {
      handleAuthCallback()
    } else {
      setStatus("error")
      setMessage("Invalid verification link. Please sign up again.")
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* African Pattern Background */}
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
                <p className="text-sm text-gray-500">Setting up your Ubuntu experience...</p>
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
                  <p className="text-green-800 font-semibold">Welcome to the Ubuntu community!</p>
                  <p className="text-green-600 text-sm mt-1">Your storytelling journey begins now</p>
                </div>
                <p className="text-sm text-gray-500">Redirecting to your dashboard in 2 seconds...</p>
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
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Sign Up Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.replace("/auth/signin")}
                    className="w-full bg-transparent hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                  >
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
