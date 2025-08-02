"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()

  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      console.log("🔄 AuthProvider: Fetching profile for:", userId)

      const { data: profile, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("👤 AuthProvider: No profile found")
          return null
        }
        console.error("❌ AuthProvider: Profile fetch error:", error)
        return null
      }

      console.log("✅ AuthProvider: Profile loaded:", profile.email)

      // ✅ Update last seen (non-blocking)
      supabase
        .from("users")
        .update({
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .then(() => console.log("✅ AuthProvider: Last seen updated"))
        .catch((err) => console.warn("⚠️ AuthProvider: Last seen update failed:", err))

      return profile
    } catch (error) {
      console.error("❌ AuthProvider: Profile fetch failed:", error)
      return null
    }
  }, [])

  // ✅ Initialize auth state once
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("🔄 AuthProvider: Initializing...")

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("❌ AuthProvider: Session error:", error)
          if (mounted) {
            setUser(null)
            setLoading(false)
            setInitialized(true)
          }
          return
        }

        if (session?.user) {
          console.log("✅ AuthProvider: Found session for:", session.user.email)
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUser(profile)
            setLoading(false)
            setInitialized(true)
          }
        } else {
          console.log("ℹ️ AuthProvider: No session found")
          if (mounted) {
            setUser(null)
            setLoading(false)
            setInitialized(true)
          }
        }
      } catch (error) {
        console.error("❌ AuthProvider: Initialization error:", error)
        if (mounted) {
          setUser(null)
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [fetchUserProfile])

  // ✅ Listen for auth changes only after initialization
  useEffect(() => {
    if (!initialized) return

    let mounted = true
    let processingAuth = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || processingAuth) return

      processingAuth = true
      console.log("🔄 AuthProvider: Auth state changed:", event)

      try {
        if (event === "SIGNED_IN" && session?.user) {
          console.log("✅ AuthProvider: User signed in:", session.user.email)
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUser(profile)
            setLoading(false)
          }
        } else if (event === "SIGNED_OUT") {
          console.log("🚪 AuthProvider: User signed out")
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          console.log("🔄 AuthProvider: Token refreshed")
          // Don't refetch profile on token refresh, just update session
          if (mounted && !user) {
            const profile = await fetchUserProfile(session.user.id)
            setUser(profile)
          }
        }
      } catch (error) {
        console.error("❌ AuthProvider: Auth state change error:", error)
        if (mounted) {
          setLoading(false)
        }
      } finally {
        processingAuth = false
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initialized, fetchUserProfile, user])

  const handleSignOut = useCallback(async () => {
    try {
      console.log("🚪 AuthProvider: Signing out...")
      setLoading(true)

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      console.log("✅ AuthProvider: Sign out successful")

      router.push("/auth/signin")
    } catch (error) {
      console.error("❌ AuthProvider: Sign out error:", error)
      router.push("/auth/signin")
    } finally {
      setLoading(false)
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id)
      setUser(profile)
    }
  }, [fetchUserProfile])

  const value = {
    user,
    loading,
    signOut: handleSignOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log("🔒 useRequireAuth: Redirecting to signin")
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  return { user, loading }
}
