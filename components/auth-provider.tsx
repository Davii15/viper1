"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User as CustomUser } from "@/lib/supabase"

interface AuthContextType {
  user: CustomUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
  initialSession: any
  initialUser: CustomUser | null
}

export function AuthProvider({ children, initialSession, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<CustomUser | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser) // ✅ Start with false if we have initial user

  // ✅ Memoize fetchUserProfile to prevent recreation
  const fetchUserProfile = useCallback(async (userId: string): Promise<CustomUser | null> => {
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

      // ✅ Update last seen (fire and forget)
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

  // ✅ Initialize auth state
  useEffect(() => {
    let mounted = true
    let authSubscription: any = null

    const initializeAuth = async () => {
      try {
        console.log("🔄 AuthProvider: Starting initialization...")

        // ✅ If we have initial user from server, we're done
        if (initialUser) {
          console.log("✅ AuthProvider: Using initial user from server:", initialUser.email)
          setUser(initialUser)
          setLoading(false)
          return
        }

        // ✅ Check current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("❌ AuthProvider: Session error:", sessionError)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (session?.user) {
          console.log("✅ AuthProvider: Found session for:", session.user.email)
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUser(profile)
            setLoading(false)
          }
        } else {
          console.log("ℹ️ AuthProvider: No session found")
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
        }
      } catch (error) {
        console.error("❌ AuthProvider: Initialization error:", error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    // ✅ Set up auth state listener
    const setupAuthListener = () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return

        console.log("🔄 AuthProvider: Auth state changed:", event)

        try {
          if (event === "SIGNED_IN" && session?.user) {
            console.log("✅ AuthProvider: User signed in:", session.user.email)
            setLoading(true)
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
            // Don't set loading for token refresh, just update profile silently
            const profile = await fetchUserProfile(session.user.id)
            if (mounted) {
              setUser(profile)
            }
          }
        } catch (error) {
          console.error("❌ AuthProvider: Auth state change error:", error)
          if (mounted) {
            setLoading(false)
          }
        }
      })

      authSubscription = subscription
    }

    // ✅ Initialize everything
    initializeAuth()
    setupAuthListener()

    // ✅ Cleanup
    return () => {
      mounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [fetchUserProfile, initialUser])

  // ✅ Sign out function
  const handleSignOut = useCallback(async () => {
    try {
      console.log("🚪 AuthProvider: Signing out...")
      setLoading(true)

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      console.log("✅ AuthProvider: Sign out successful")

      // ✅ Redirect to sign in
      window.location.href = "/auth/signin"
    } catch (error) {
      console.error("❌ AuthProvider: Sign out error:", error)
      // Force redirect even if sign out fails
      window.location.href = "/auth/signin"
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ Refresh user function
  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id)
      setUser(profile)
    }
  }, [fetchUserProfile])

  // ✅ Context value
  const value = {
    user,
    loading,
    signOut: handleSignOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ✅ Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// ✅ Hook to require authentication with timeout
export function useRequireAuth() {
  const { user, loading } = useAuth()

  useEffect(() => {
    // ✅ Set a reasonable timeout for auth check
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Auth check taking too long, redirecting to sign in")
        window.location.href = "/auth/signin"
      }
    }, 5000) // 5 second timeout

    // ✅ Clear timeout if auth completes
    if (!loading) {
      clearTimeout(timeout)
    }

    // ✅ Redirect if no user after loading completes
    if (!loading && !user) {
      console.log("🔒 useRequireAuth: Redirecting unauthenticated user")
      window.location.href = "/auth/signin"
    }

    return () => clearTimeout(timeout)
  }, [user, loading])

  return { user, loading }
}
