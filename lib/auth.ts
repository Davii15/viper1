import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/supabase"

// 🌍 CLOUD-FIRST AUTHENTICATION - Access from ANY device, ANYWHERE
export const signIn = async (email: string, password: string) => {
  console.log("🔐 Cloud authentication - signing in from any device...")

  try {
    // ✅ Pure Supabase auth - no localStorage needed
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

    // ✅ Verify user exists in our database (cloud verification)
    const userProfile = await verifyUserInDatabase(data.user.id)

    console.log("✅ Cloud sign in successful - accessible from any device")
    return { ...data, userProfile }
  } catch (error) {
    console.error("❌ Cloud sign in failed:", error)
    throw error
  }
}

export const signOut = async () => {
  console.log("🚪 Cloud sign out - clearing session...")

  try {
    // ✅ Clear Supabase session (this is cloud-based)
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    console.log("✅ Cloud sign out successful")

    // ✅ Force page reload to clear any cached data
    if (typeof window !== "undefined") {
      window.location.href = "/auth/signin"
    }
  } catch (error) {
    console.error("❌ Sign out error:", error)
    throw error
  }
}

// 🎯 MAIN FUNCTION: Get user from DATABASE (cloud-based, device-independent)
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log("🔍 Checking cloud authentication status...")

    // ✅ Step 1: Check if user has valid Supabase session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ Session error:", sessionError)
      return null
    }

    if (!session?.user) {
      console.log("❌ No active cloud session")
      return null
    }

    const authUser = session.user
    console.log("✅ Cloud session found for:", authUser.email)

    // ✅ Step 2: Get user profile from DATABASE (the source of truth)
    const userProfile = await getUserFromDatabase(authUser.id)

    if (!userProfile) {
      // User authenticated but no profile - create one
      console.log("👤 Creating missing user profile in database...")
      return await createUserProfileInDatabase(authUser)
    }

    // ✅ Step 3: Update last seen (non-blocking, cloud-based)
    updateLastSeenInDatabase(authUser.id).catch((err) => console.warn("⚠️ Last seen update failed:", err))

    console.log("✅ User loaded from cloud database - accessible from any device")
    return userProfile
  } catch (error) {
    console.error("❌ Cloud authentication check failed:", error)
    return null
  }
}

// ✅ Get user from database (pure cloud function)
const getUserFromDatabase = async (userId: string): Promise<User | null> => {
  try {
    const { data: profile, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // User doesn't exist in database
        return null
      }
      throw error
    }

    return profile
  } catch (error) {
    console.error("❌ Database user fetch failed:", error)
    return null
  }
}

// ✅ Verify user exists in database
const verifyUserInDatabase = async (userId: string): Promise<User | null> => {
  const profile = await getUserFromDatabase(userId)

  if (!profile) {
    console.log("⚠️ User authenticated but no database profile found")
    return null
  }

  return profile
}

// ✅ Create user profile in database (cloud-based)
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
      // Return the profile data even if database insert failed
      return newProfile as User
    }

    console.log("✅ User profile created in cloud database")
    return createdProfile
  } catch (error) {
    console.error("❌ Profile creation error:", error)
    throw error
  }
}

// ✅ Update last seen in database (cloud-based)
const updateLastSeenInDatabase = async (userId: string) => {
  try {
    await supabase
      .from("users")
      .update({
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    console.log("✅ Last seen updated in cloud database")
  } catch (error) {
    console.error("❌ Last seen update failed:", error)
  }
}

// ✅ Check if user is authenticated (cloud-based)
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    return !!user
  } catch {
    return false
  }
}

// ✅ Cloud-based signup (no localStorage needed)
export const signUp = async (email: string, password: string, metadata: any) => {
  console.log("📝 Cloud signup - accessible from any device after verification...")

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
      console.error("❌ Cloud signup error:", error)
      throw error
    }

    console.log("✅ Cloud signup successful - check email for verification")
    return data
  } catch (error) {
    console.error("❌ Cloud signup failed:", error)
    throw error
  }
}

// ✅ Get base URL (works on any device)
const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

// ✅ Create user profile after email verification (cloud-based)
export const createUserProfile = async (userId: string, profileData: any) => {
  console.log("👤 Creating user profile in cloud database...")

  try {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: profileData.email,
        username: profileData.username,
        full_name: profileData.full_name,
        country: profileData.country,
        avatar_url: profileData.avatar_url || null,
        bio: null,
        location: null,
        website: null,
        verified: true, // Mark as verified since they completed email verification
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      // If user already exists, update instead
      if (error.code === "23505") {
        const { data: updatedData, error: updateError } = await supabase
          .from("users")
          .update({
            username: profileData.username,
            full_name: profileData.full_name,
            country: profileData.country,
            verified: true,
            updated_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
          })
          .eq("id", userId)
          .select()
          .single()

        if (updateError) {
          console.error("❌ Profile update error:", updateError)
          throw updateError
        }

        console.log("✅ User profile updated in cloud database")
        return updatedData
      }

      console.error("❌ Profile creation error:", error)
      throw error
    }

    console.log("✅ User profile created in cloud database")
    return data
  } catch (error) {
    console.error("❌ createUserProfile failed:", error)
    throw error
  }
}

// ✅ Clear any cached data (minimal - we rely on cloud)
export const clearUserCache = () => {
  console.log("🧹 Clearing minimal cache (cloud-based system)")
  // We don't rely on localStorage, so minimal clearing needed
}

// ✅ Update user profile (cloud-based)
export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  console.log("📝 Updating user profile in cloud database...")

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

    console.log("✅ User profile updated in cloud database")
    return data
  } catch (error) {
    console.error("❌ updateUserProfile failed:", error)
    throw error
  }
}

// ✅ Get user by email (for password reset, etc.)
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email.toLowerCase().trim()).single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // User not found
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("❌ getUserByEmail failed:", error)
    return null
  }
}
