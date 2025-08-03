import { supabase } from "./supabase"
import type { User } from "./supabase"

export const signUp = async (
  email: string,
  password: string,
  userData: {
    username: string
    full_name: string
  },
) => {
  try {
    console.log("🔐 Starting sign up process...")

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from("users")
      .select("username")
      .eq("username", userData.username)
      .single()

    if (existingUser) {
      throw new Error("Username is already taken")
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.full_name,
        },
      },
    })

    if (error) throw error

    console.log("✅ Sign up successful")
    return { data, error: null }
  } catch (error: any) {
    console.error("❌ Sign up error:", error)
    return { data: null, error }
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    console.log("🔐 Starting sign in process...")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    console.log("✅ Sign in successful")
    return { data, error: null }
  } catch (error: any) {
    console.error("❌ Sign in error:", error)
    return { data: null, error }
  }
}

export const signOut = async () => {
  try {
    console.log("🔐 Signing out...")

    const { error } = await supabase.auth.signOut()

    if (error) throw error

    console.log("✅ Sign out successful")
    return { error: null }
  } catch (error: any) {
    console.error("❌ Sign out error:", error)
    return { error }
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) return null

    // Get full user profile from database
    const { data: userProfile, error } = await supabase.from("users").select("*").eq("id", authUser.id).single()

    if (error) {
      console.error("❌ Error fetching user profile:", error)
      return null
    }

    return userProfile
  } catch (error) {
    console.error("❌ Error getting current user:", error)
    return null
  }
}

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data: userProfile, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("❌ Error fetching user profile:", error)
      return null
    }

    return userProfile
  } catch (error) {
    console.error("❌ Error getting user profile:", error)
    return null
  }
}

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    console.log("📝 Updating user profile...")

    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    console.log("✅ Profile updated successfully")
    return { data, error: null }
  } catch (error: any) {
    console.error("❌ Profile update error:", error)
    return { data: null, error }
  }
}

export const resetPassword = async (email: string) => {
  try {
    console.log("🔐 Sending password reset email...")

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error

    console.log("✅ Password reset email sent")
    return { error: null }
  } catch (error: any) {
    console.error("❌ Password reset error:", error)
    return { error }
  }
}

export const updatePassword = async (newPassword: string) => {
  try {
    console.log("🔐 Updating password...")

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error

    console.log("✅ Password updated successfully")
    return { error: null }
  } catch (error: any) {
    console.error("❌ Password update error:", error)
    return { error }
  }
}
