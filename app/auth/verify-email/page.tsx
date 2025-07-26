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
import { createUserProfile } from "@/lib/auth"

export default function VerifyEmail() {
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending")
  const [message, setMessage] = useState("")
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // User just verified their email and signed in
        await handleUserProfileCreation(session.user)
        setVerificationStatus("success")
        setMessage("Email verified successfully! Redirecting to dashboard...")

        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    })

    // Check URL parameters for verification
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")

    if (token_hash && type === "signup") {
      handleEmailVerification(token_hash)
    }

    return () => subscription.unsubscribe()
  }, [searchParams, router])

  const handleUserProfileCreation = async (user: any) => {
    try {
      // Get stored user data
      const storedUserData = localStorage.getItem("pendingUserData")
      const userData = storedUserData ? JSON.parse(storedUserData) : {}

      // Create user profile
      await createUserProfile(user.id, {
        email: user.email,
        username: userData.username || user.email.split("@")[0],
        full_name: userData.full_name || "User",
        country: userData.country,
      })

      // Clear stored data
      localStorage.removeItem("pendingUserData")
      localStorage.removeItem("pendingVerificationEmail")
    } catch (error) {
      console.error("Error creating user profile:", error)
    }
  }

  const handleEmailVerification = async (token_hash: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: "signup",
      })

      if (error) throw error

      // The onAuthStateChange will handle the rest
    } catch (error: any) {
      setVerificationStatus("error")
      setMessage(error.message || "Failed to verify email. Please try again.")
    }
  }

  const handleResendVerification = async () => {
    setResending(true)
    try {
      const email = localStorage.getItem("pendingVerificationEmail")
      if (!email) {
        setMessage("Please sign up again to receive a new verification email")
        return
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        },
      })

      if (error) throw error

      setMessage("Verification email sent! Please check your inbox.")
    } catch (error: any) {
      setMessage(error.message || "Failed to resend verification email")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* African Pattern Background */}
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
                  ? "Verification Failed"
                  : "Check Your Email"}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            {verificationStatus === "pending" && (
              <>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    We've sent you a verification link. Please check your email and click the link to activate your
                    Posti account.
                  </p>

                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">📧 Check these folders:</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Primary inbox</li>
                      <li>• Spam/Junk folder</li>
                      <li>• Promotions tab (Gmail)</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Didn't receive the email?</p>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                    onClick={handleResendVerification}
                    disabled={resending}
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
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-6xl"
                >
                  🎉
                </motion.div>
                <p className="text-green-600 font-semibold">
                  Welcome to the Ubuntu community! Your account is now active.
                </p>
                <p className="text-gray-600">You'll be redirected to your dashboard shortly...</p>
              </div>
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
                    disabled={resending}
                  >
                    Resend Verification Email
                  </Button>
                  <Link href="/auth/signup">
                    <Button variant="ghost" className="w-full">
                      Sign Up Again
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {message && verificationStatus === "pending" && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-700">{message}</AlertDescription>
              </Alert>
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
