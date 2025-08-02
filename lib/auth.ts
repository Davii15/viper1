import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/supabase"

// ✅ Simplified, fast authentication functions
export const signIn = async (email: string, password: string) => {
  console.log("🔐 Signing in user...")

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error) {
      console.error("❌ Sign in error:", error)
      throw error
    }

    if (!data.user) {
      throw new Error("Authentication failed - no user data")
    }

    console.log("✅ Sign in successful")
    return data
  } catch (error) {
    console.error("❌ Sign in failed:", error)
    throw error
  }
}

export const signOut = async () => {
  console.log("🚪 Signing out...")

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    console.log("✅ Sign out successful")

    // ✅ Clean redirect without force reload
    if (typeof window !== "undefined") {
      window.location.href = "/auth/signin"
    }
  } catch (error) {
    console.error("❌ Sign out error:", error)
    throw error
  }
}

// ✅ Fast user fetching - only get from database if needed
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log("🔍 Getting current user...")

    // ✅ Quick session check first
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ Session error:", sessionError)
      return null
    }

    if (!session?.user) {
      console.log("❌ No active session")
      return null
    }

    const authUser = session.user
    console.log("✅ Session found for:", authUser.email)

    // ✅ Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single()

    if (profileError) {
      if (profileError.code === "PGRST116") {
        // User doesn't exist in database - create profile
        console.log("👤 Creating missing user profile...")
        return await createUserProfileInDatabase(authUser)
      }
      throw profileError
    }

    // ✅ Update last seen (non-blocking)
    supabase
      .from("users")
      .update({
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", authUser.id)
      .then(() => console.log("✅ Last seen updated"))
      .catch((err) => console.warn("⚠️ Last seen update failed:", err))

    console.log("✅ User loaded successfully")
    return profile
  } catch (error) {
    console.error("❌ Get current user failed:", error)
    return null
  }
}

// ✅ Create user profile in database
const createUserProfileInDatabase = async (authUser: any): Promise<User> => {
  try {
    const newProfile = {
      id: authUser.id,
      email: authUser.email!,
      username: authUser.user_metadata.username || authUser.email!.split("@")[0],
      full_name: authUser.user_metadata.full_name || "User",
      country: authUser.user_metadata.country || null,
      avatar_url: authUser.user_metadata.avatar_url || null,
      bio: null,
      location: null,
      website: null,
      verified: authUser.email_confirmed_at ? true : false,
      created_at: authUser.created_at,
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    }

    const { data: createdProfile, error } = await supabase.from("users").insert(newProfile).select().single()

    if (error) {
      console.error("❌ Database profile creation failed:", error)
      return newProfile as User
    }

    console.log("✅ User profile created")
    return createdProfile
  } catch (error) {
    console.error("❌ Profile creation error:", error)
    throw error
  }
}

export const signUp = async (email: string, password: string, metadata: any) => {
  console.log("📝 Signing up user...")

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          username: metadata.username,
          full_name: metadata.full_name,
          country: metadata.country,
        },
        emailRedirectTo: `${getBaseUrl()}/auth/callback`,
      },
    })

    if (error) {
      console.error("❌ Sign up error:", error)
      throw error
    }

    console.log("✅ Sign up successful")
    return data
  } catch (error) {
    console.error("❌ Sign up failed:", error)
    throw error
  }
}

const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "https://posti-phi.vercel.app"
}

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    return !!user
  } catch {
    return false
  }
}

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  console.log("📝 Updating user profile...")

  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("❌ Profile update error:", error)
      throw error
    }

    console.log("✅ User profile updated")
    return data
  } catch (error) {
    console.error("❌ updateUserProfile failed:", error)
    throw error
  }
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email.toLowerCase().trim()).single()

    if (error) {
      if (error.code === "PGRST116") {
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("❌ getUserByEmail failed:", error)
    return null
  }
}
