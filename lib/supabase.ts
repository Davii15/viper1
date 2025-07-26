import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    // ✅ Mobile-optimized storage configuration
    storage:
      typeof window !== "undefined"
        ? {
            getItem: (key: string) => {
              try {
                return window.localStorage.getItem(key)
              } catch (error) {
                console.warn("LocalStorage getItem failed:", error)
                return null
              }
            },
            setItem: (key: string, value: string) => {
              try {
                window.localStorage.setItem(key, value)
              } catch (error) {
                console.warn("LocalStorage setItem failed:", error)
              }
            },
            removeItem: (key: string) => {
              try {
                window.localStorage.removeItem(key)
              } catch (error) {
                console.warn("LocalStorage removeItem failed:", error)
              }
            },
          }
        : undefined,
    storageKey: "posti-auth-token",
    // ✅ Disable debug in production
    debug: process.env.NODE_ENV === "development",
  },
  global: {
    headers: {
      "X-Client-Info": "posti-web-app",
    },
  },
})

// ✅ Simplified session management
export const getSessionSafely = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  } catch (error) {
    console.error("❌ Session Error:", error)
    return { data: { session: null }, error }
  }
}

// ✅ Auth state change listener (only in development)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("🔄 Auth Event:", event)
    console.log("📋 Session:", session ? "EXISTS" : "NULL")
  })
}

// Types (keeping existing types)
export interface User {
  id: string
  email: string
  username: string
  full_name: string
  avatar_url?: string
  bio?: string
  location?: string
  country?: string
  website?: string
  verified: boolean
  created_at: string
  updated_at: string
  last_seen: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  content: string
  excerpt?: string
  cover_image_url?: string
  post_type: "blog" | "microblog" | "image" | "video"
  status: "draft" | "published" | "archived"
  views_count: number
  likes_count: number
  comments_count: number
  shares_count: number
  is_trending: boolean
  trending_score: number
  created_at: string
  updated_at: string
  user?: User
  categories?: Category[]
  is_liked?: boolean
  is_bookmarked?: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  parent_id?: string
  created_at: string
  updated_at: string
  user?: User
  replies?: Comment[]
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message?: string
  data?: any
  read: boolean
  created_at: string
}
