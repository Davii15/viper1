import { supabaseBrowser } from "./supabase/client"
import type { User } from "./supabase"

// Use the SSR-compatible browser client
const supabase = supabaseBrowser

// ✅ Simple cache for mobile optimization
let userCache: User | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

// Clear cache helper
export const clearUserCache = () => {
  userCache = null
  cacheTimestamp = 0
}

export const signUp = async (
  email: string,
  password: string,
  userData: {
    username: string
    full_name: string
    country?: string
  },
) => {
  // Store email for potential resend
  if (typeof window !== "undefined") {
    localStorage.setItem("pendingVerificationEmail", email)
    localStorage.setItem("pendingUserData", JSON.stringify(userData))
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      // ✅ Fix redirect URL to match your callback
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

export const signIn = async (email: string, password: string) => {
  console.log("🔐 Starting sign in process...")

  // ✅ Clear cache before sign in
  clearUserCache()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("❌ Sign in error:", error)
    throw error
  }

  // ✅ Simplified profile handling - don't block sign in
  if (data.user) {
    // Handle profile creation asynchronously
    handleUserProfile(data.user).catch((err) => console.warn("Profile handling failed:", err))
  }

  console.log("✅ Sign in successful")
  return data
}

// ✅ Separate async function for profile handling
const handleUserProfile = async (user: any) => {
  try {
    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (profileError && profileError.code === "PGRST116") {
      // Profile doesn't exist, create it
      const userData = user.user_metadata
      await supabase.from("users").insert({
        id: user.id,
        email: user.email!,
        username: userData.username || user.email!.split("@")[0],
        full_name: userData.full_name || "User",
        country: userData.country,
        avatar_url: user.user_metadata.avatar_url,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      })
    } else if (!profileError) {
      // Update last seen
      await supabase
        .from("users")
        .update({
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    }
  } catch (error) {
    console.warn("Profile operations failed:", error)
  }
}

export const signOut = async () => {
  console.log("🚪 Starting sign out process...")

  // ✅ Clear cache before sign out
  clearUserCache()

  const { error } = await supabase.auth.signOut()
  if (error) throw error

  // Clear stored data
  if (typeof window !== "undefined") {
    localStorage.removeItem("pendingVerificationEmail")
    localStorage.removeItem("pendingUserData")
  }

  console.log("✅ Sign out successful")
}

// ✅ Completely rewritten for mobile compatibility
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Check cache first (simple timestamp check)
    if (userCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return userCache
    }

    // ✅ Get session with timeout for mobile
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Session timeout")), 5000))

    const { data: sessionData, error: sessionError } = (await Promise.race([sessionPromise, timeoutPromise])) as any

    if (sessionError || !sessionData.session?.user) {
      clearUserCache()
      return null
    }

    const authUser = sessionData.session.user
    console.log("✅ Session found for user:", authUser.email)

    try {
      // ✅ Try to get user profile with timeout
      const profilePromise = supabase.from("users").select("*").eq("id", authUser.id).single()

      const profileTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Profile timeout")), 3000),
      )

      const { data: profile, error: profileError } = (await Promise.race([
        profilePromise,
        profileTimeoutPromise,
      ])) as any

      let userData: User

      if (profileError && profileError.code === "PGRST116") {
        // ✅ Profile doesn't exist, create it
        console.log("📝 Creating user profile...")
        const newProfile = {
          id: authUser.id,
          email: authUser.email!,
          username: authUser.user_metadata.username || authUser.email!.split("@")[0],
          full_name: authUser.user_metadata.full_name || "User",
          country: authUser.user_metadata.country,
          avatar_url: authUser.user_metadata.avatar_url,
          verified: false,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        }

        try {
          const { data: createdProfile, error: createError } = await supabase
            .from("users")
            .insert(newProfile)
            .select()
            .single()

          if (createError) {
            console.warn("Profile creation failed, using auth data:", createError)
            userData = newProfile as User
          } else {
            userData = createdProfile
          }
        } catch (createErr) {
          console.warn("Profile creation failed, using fallback:", createErr)
          userData = newProfile as User
        }
      } else if (profileError) {
        // ✅ Profile query failed, use auth metadata as fallback
        console.warn("Profile fetch failed, using auth data:", profileError)
        userData = {
          id: authUser.id,
          email: authUser.email!,
          username: authUser.user_metadata.username || authUser.email!.split("@")[0],
          full_name: authUser.user_metadata.full_name || "User",
          country: authUser.user_metadata.country,
          avatar_url: authUser.user_metadata.avatar_url,
          verified: false,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
          last_seen: new Date().toISOString(),
        } as User
      } else {
        // ✅ Profile found successfully
        userData = profile

        // ✅ Update last_seen asynchronously (don't wait for it)
        supabase
          .from("users")
          .update({
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id)
          .then(() => console.log("✅ Last seen updated"))
          .catch((err) => console.warn("⚠️ Last seen update failed:", err))
      }

      // ✅ Cache the result
      userCache = userData
      cacheTimestamp = Date.now()

      return userData
    } catch (error: any) {
      if (error.message === "Profile timeout") {
        console.warn("Profile fetch timed out, using auth data")
      } else {
        console.warn("Profile operations failed:", error)
      }

      // ✅ Fallback to auth metadata
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email!,
        username: authUser.user_metadata.username || authUser.email!.split("@")[0],
        full_name: authUser.user_metadata.full_name || "User",
        country: authUser.user_metadata.country,
        avatar_url: authUser.user_metadata.avatar_url,
        verified: false,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at,
        last_seen: new Date().toISOString(),
      }

      // ✅ Cache fallback data
      userCache = fallbackUser
      cacheTimestamp = Date.now()

      return fallbackUser
    }
  } catch (error: any) {
    if (error.message === "Session timeout") {
      console.warn("Session check timed out")
    } else {
      console.error("❌ getCurrentUser error:", error)
    }
    clearUserCache()
    return null
  }
}

// ✅ Simple session check for mobile
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 3000))

    const { data } = (await Promise.race([sessionPromise, timeoutPromise])) as any
    return !!data.session?.user
  } catch {
    return false
  }
}

// Create profile after email verification
export const createUserProfile = async (userId: string, userData: any) => {
  const { error } = await supabase.from("users").upsert({
    id: userId,
    email: userData.email,
    username: userData.username,
    full_name: userData.full_name,
    country: userData.country,
    verified: true, // ✅ Set verified to true after email verification
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  })

  if (error) {
    console.error("Profile creation error:", error)
    throw error
  }

  // ✅ Clear cache to force refresh
  clearUserCache()
}

// ✅ Session refresh utility
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    clearUserCache()
    return data
  } catch (error) {
    console.error("Session refresh error:", error)
    throw error
  }
}
