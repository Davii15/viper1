"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabaseBrowser as supabase } from "@/lib/supabase/client" // Corrected import: alias supabaseBrowser to supabase
import type { User as CustomUser } from "@/lib/supabase/client"

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
  const [loading, setLoading] = useState(!initialUser) // Start with false if we have initial user

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

  useEffect(() => {
    let mounted = true
    let authSubscription: any = null
    let lastEventId: string | null = null
    let processingAuth = false

    const initializeAuth = async () => {
      try {
        console.log("🔄 AuthProvider: Starting initialization...")

        if (initialUser) {
          console.log("✅ AuthProvider: Using initial user from server:", initialUser.email)
          setUser(initialUser)
          setLoading(false)
          return
        }

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

    const setupAuthListener = () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted || processingAuth) return

        const eventId = `${event}-${session?.user?.id || "none"}-${Date.now()}`

        if (lastEventId && lastEventId.startsWith(`${event}-${session?.user?.id || "none"}`)) {
          console.log(`⏭️ AuthProvider: Skipping duplicate ${event} event`)
          return
        }

        lastEventId = eventId
        processingAuth = true

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
            const profile = await fetchUserProfile(session.user.id)
            if (mounted) {
              setUser(profile)
            }
          } else if (event === "INITIAL_SESSION" && session?.user) {
            console.log("🔄 AuthProvider: Initial session detected")
            if (!user) {
              const profile = await fetchUserProfile(session.user.id)
              if (mounted) {
                setUser(profile)
                setLoading(false)
              }
            }
          }
        } catch (error) {
          console.error("❌ AuthProvider: Auth state change error:", error)
          if (mounted) {
            setLoading(false)
          }
        } finally {
          processingAuth = false
          setTimeout(() => {
            if (lastEventId === eventId) {
              lastEventId = null
            }
          }, 1000)
        }
      })

      authSubscription = subscription
    }

    initializeAuth()
    setupAuthListener()

    return () => {
      mounted = false
      processingAuth = false
      lastEventId = null
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [fetchUserProfile, initialUser]) // Removed 'user' from dependencies

  const handleSignOut = useCallback(async () => {
    try {
      console.log("🚪 AuthProvider: Signing out...")
      setLoading(true)

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      console.log("✅ AuthProvider: Sign out successful")

      window.location.href = "/auth/signin"
    } catch (error) {
      console.error("❌ AuthProvider: Sign out error:", error)
      window.location.href = "/auth/signin"
    } finally {
      setLoading(false)
    }
  }, [])

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

  useEffect(() => {
    if (!loading && !user) {
      console.log("🔒 useRequireAuth: No user found after loading complete")
    }
  }, [user, loading])

  return { user, loading }
}
