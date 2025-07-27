import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/supabase"

export const signIn = async (email: string, password: string) => {
  console.log("🔐 Starting sign in process...")

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("❌ Sign in error:", error)
    throw error
  }

  console.log("✅ Sign in successful")
  return data
}

export const signOut = async () => {
  console.log("🚪 Starting sign out process...")
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  console.log("✅ Sign out successful")
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    const authUser = session.user
    console.log("✅ Session found for user:", authUser.email)

    // Try to get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single()

    if (profileError && profileError.code === "PGRST116") {
      // Profile doesn't exist, create it
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

      const { data: createdProfile, error: createError } = await supabase
        .from("users")
        .insert(newProfile)
        .select()
        .single()

      if (createError) {
        console.warn("Profile creation failed, using auth data:", createError)
        return newProfile as User
      }

      return createdProfile
    } else if (profileError) {
      console.warn("Profile fetch failed, using auth data:", profileError)
      return {
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
    }

    // Update last seen
    supabase
      .from("users")
      .update({
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", authUser.id)
      .then(() => console.log("✅ Last seen updated"))
      .catch((err) => console.warn("⚠️ Last seen update failed:", err))

    return profile
  } catch (error) {
    console.error("❌ getCurrentUser error:", error)
    return null
  }
}

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession()
    return !!data.session?.user
  } catch {
    return false
  }
}

export const clearUserCache = () => {
  // Simple cache clear function
  console.log("🧹 Clearing user cache")
}

export const signUp = async (email: string, password: string, metadata: any) => {
  console.log("📝 Starting sign up process...")

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      // 🎯 THIS is where the email link will go first
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    console.error("❌ Sign up error:", error)
    throw error
  }

  // Store user data for profile creation after verification
  if (typeof window !== "undefined") {
    localStorage.setItem("pendingUserData", JSON.stringify(metadata))
    localStorage.setItem("pendingVerificationEmail", email)
  }

  console.log("✅ Sign up successful, verification email sent")
  return data
}

export const createUserProfile = async (userId: string, profileData: any) => {
  console.log("👤 Creating user profile...")

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      ...profileData,
      verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("❌ Profile creation error:", error)
    throw error
  }

  console.log("✅ User profile created successfully")
  return data
}
