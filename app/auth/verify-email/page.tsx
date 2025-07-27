"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft, CheckCircle, RefreshCw, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

export default function VerifyEmail() {
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending")
  const [message, setMessage] = useState("Check your email for the verification link")
  const [resending, setResending] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    initializeVerificationPage()
  }, [])

  const initializeVerificationPage = async () => {
    try {
      // ✅ Check if user is already authenticated (cloud-based)
      const user = await getCurrentUser()
      if (user) {
        console.log("✅ User already verified, redirecting to dashboard")
        router.replace("/dashboard")
        return
      }

      // ✅ Get email from URL params (cloud-based approach)
      const email = searchParams.get("email")
      if (email) {
        setUserEmail(email)
        setMessage(`We've sent a verification link to ${email}. Please check your inbox.`)
      } else {
        setMessage("Please check your email for the verification link.")
      }

      // ✅ Listen for auth state changes (cloud-based)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("🔄 Auth state change:", event, session?.user?.email)

        if (event === "SIGNED_IN" && session?.user) {
          try {
            setVerificationStatus("success")
            setMessage("Email verified successfully! Setting up your global account...")

            // ✅ Ensure user profile exists in cloud database
            await ensureUserProfile(session.user)

            setMessage("Karibu Posti! Your global account is ready! 🌍")

            // ✅ Redirect to dashboard
            setTimeout(() => {
              router.replace("/dashboard")
            }, 2000)
          } catch (error) {
            console.error("❌ Profile setup error:", error)
            setVerificationStatus("error")
            setMessage(
              "Verification successful, but there was an issue setting up your profile. Please try signing in.",
            )
          }
        }
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error("❌ Verification page initialization error:", error)
      setVerificationStatus("error")
      setMessage("There was an issue loading the verification page. Please try again.")
    }
  }

  // ✅ Ensure user profile exists in cloud database
  const ensureUserProfile = async (user: any) => {
    try {
      console.log("👤 Ensuring user profile exists in cloud database...")

      // Check if profile already exists
      const { data: existingProfile } = await supabase.from("users").select("id").eq("id", user.id).single()

      if (existingProfile) {
        console.log("✅ User profile already exists in cloud database")
        return
      }

      // Create user profile in cloud database
      const profileData = {
        id: user.id,
        email: user.email,
        username: user.user_metadata.username || user.email.split("@")[0],
        full_name: user.user_metadata.full_name || "User",
        country: user.user_metadata.country || null,
        avatar_url: user.user_metadata.avatar_url || null,
        bio: null,
        location: null,
        website: null,
        verified: true, // Mark as verified since email is confirmed
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      }

      const { error } = await supabase.from("users").insert(profileData)

      if (error && error.code !== "23505") {
        // Ignore duplicate key error
        throw error
      }

      console.log("✅ User profile created in cloud database")
    } catch (error) {
      console.error("❌ Profile creation error:", error)
      throw error
    }
  }

  const handleResendVerification = async () => {
    if (!userEmail) {
      setMessage("Please sign up again to receive a new verification email")
      return
    }

    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage("Verification email sent! Please check your inbox and spam folder.")
    } catch (error: any) {
      console.error("❌ Resend error:", error)
      setMessage(error.message || "Failed to resend verification email")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl animate-pulse">📧</div>
        <div className="absolute top-20 right-20 text-4xl animate-bounce">✨</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-pulse">🌍</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-bounce">🎉</div>
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
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                verificationStatus === "success"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : verificationStatus === "error"
                    ? "bg-gradient-to-r from-red-500 to-pink-500"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500"
              }`}
            >
              {verificationStatus === "success" ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : verificationStatus === "error" ? (
                <AlertCircle className="w-8 h-8 text-white" />
              ) : (
                <Mail className="w-8 h-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {verificationStatus === "success"
                ? "Karibu Posti! 🎉"
                : verificationStatus === "error"
                  ? "Verification Issue"
                  : "Check Your Email"}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <p className="text-gray-600">{message}</p>

            {verificationStatus === "pending" && (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">🌍 Global Account Activation</h4>
                  <p className="text-sm text-blue-700">
                    Once verified, you can access your account from any device, anywhere in the world!
                  </p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">📧 Check these folders:</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Primary inbox</li>
                    <li>• Spam/Junk folder</li>
                    <li>• Promotions tab (Gmail)</li>
                    <li>• Social tab (Gmail)</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Didn't receive the email?</p>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                    onClick={handleResendVerification}
                    disabled={resending || !userEmail}
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {verificationStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="text-6xl">🎉</div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                  <p className="text-green-800 font-semibold">Welcome to the global Ubuntu community!</p>
                  <p className="text-green-600 text-sm mt-1">
                    Your account is now accessible from anywhere in the world
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">🌍 What you can do now:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Write blogs from any device</li>
                    <li>• Access your account from internet cafes</li>
                    <li>• No need to carry your device everywhere</li>
                    <li>• Your stories are safely stored in the cloud</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
              </motion.div>
            )}

            {verificationStatus === "error" && (
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{message}</AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    onClick={handleResendVerification}
                    disabled={resending || !userEmail}
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                  <Link href="/auth/signup">
                    <Button variant="ghost" className="w-full">
                      Sign Up Again
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <Link href="/auth/signin">
              <Button variant="ghost" className="w-full hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
