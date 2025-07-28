"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
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
  const [loading, setLoading] = useState(!initialUser)

  // ✅ Sync server session with client state
  useEffect(() => {
    console.log("🔄 AuthProvider: Initializing with server session")

    if (initialUser) {
      setUser(initialUser)
      setLoading(false)
      console.log("✅ AuthProvider: User loaded from server:", initialUser.email)
    }

    // ✅ Listen for auth state changes (sign in/out from other tabs)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 AuthProvider: Auth state changed:", event)

      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ AuthProvider: User signed in, fetching profile...")
        await fetchUserProfile(session.user.id)
      } else if (event === "SIGNED_OUT") {
        console.log("🚪 AuthProvider: User signed out")
        setUser(null)
        setLoading(false)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        console.log("🔄 AuthProvider: Token refreshed")
        await fetchUserProfile(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialUser])

  // ✅ Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true)

      const { data: profile, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("👤 AuthProvider: No profile found, user needs to complete setup")
          setUser(null)
        } else {
          console.error("❌ AuthProvider: Profile fetch error:", error)
          setUser(null)
        }
      } else {
        console.log("✅ AuthProvider: Profile loaded:", profile.email)
        setUser(profile)

        // ✅ Update last seen
        supabase
          .from("users")
          .update({
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
          .then(() => console.log("✅ AuthProvider: Last seen updated"))
          .catch((err) => console.warn("⚠️ AuthProvider: Last seen update failed:", err))
      }
    } catch (error) {
      console.error("❌ AuthProvider: Fetch user profile failed:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Sign out function
  const handleSignOut = async () => {
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
  }

  // ✅ Refresh user data
  const refreshUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      await fetchUserProfile(session.user.id)
    }
  }

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

// ✅ Hook to require authentication
export function useRequireAuth() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      console.log("🔒 useRequireAuth: Redirecting unauthenticated user")
      window.location.href = "/auth/signin"
    }
  }, [user, loading])

  return { user, loading }
}
