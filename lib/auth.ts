import { supabaseBrowser } from "./supabase/client"
import type { User } from "./supabase"

// Use the SSR-compatible browser client
const supabase = supabaseBrowser

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
      emailRedirectTo: `${window.location.origin}/auth/verify-email`,
    },
  })

  if (error) throw error
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Check if user profile exists, create if it doesn't
  if (data.user) {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError && profileError.code === "PGRST116") {
      // Profile doesn't exist, create it
      const userData = data.user.user_metadata
      const { error: createError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email!,
        username: userData.username || data.user.email!.split("@")[0],
        full_name: userData.full_name || "User",
        country: userData.country,
        avatar_url: data.user.user_metadata.avatar_url,
      })

      if (createError) {
        console.error("Profile creation error:", createError)
      }
    }

    // Update last seen
    await supabase
      .from("users")
      .update({
        last_seen: new Date().toISOString(),
      })
      .eq("id", data.user.id)
  }

  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error

  // Clear stored data
  if (typeof window !== "undefined") {
    localStorage.removeItem("pendingVerificationEmail")
    localStorage.removeItem("pendingUserData")
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Try to get profile, create if doesn't exist
  let { data: profile, error } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (error && error.code === "PGRST116") {
    // Profile doesn't exist, create it
    const userData = user.user_metadata
    const { data: newProfile, error: createError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email!,
        username: userData.username || user.email!.split("@")[0],
        full_name: userData.full_name || "User",
        country: userData.country,
        avatar_url: userData.avatar_url,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error("Profile creation error:", createError)
      return null
    }

    profile = newProfile
  }

  return profile as User
}

// Create profile after email verification
export const createUserProfile = async (userId: string, userData: any) => {
  const { error } = await supabase.from("users").upsert({
    id: userId,
    email: userData.email,
    username: userData.username,
    full_name: userData.full_name,
    country: userData.country,
    verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  })

  if (error) {
    console.error("Profile creation error:", error)
    throw error
  }
}
