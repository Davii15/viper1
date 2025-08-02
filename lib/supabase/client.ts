import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const getSupabaseClient = () => {
  return supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storage:
        typeof window !== "undefined"
          ? {
              getItem: (key: string) => {
                try {
                  return window.localStorage.getItem(key)
                } catch (error) {
                  console.warn("LocalStorage access failed, using memory storage:", error)
                  return null
                }
              },
              setItem: (key: string, value: string) => {
                try {
                  window.localStorage.setItem(key, value)
                } catch (error) {
                  console.warn("LocalStorage write failed:", error)
                }
              },
              removeItem: (key: string) => {
                try {
                  window.localStorage.removeItem(key)
                } catch (error) {
                  console.warn("LocalStorage remove failed:", error)
                }
              },
            }
          : undefined,
      storageKey: "posti-auth-token",
      debug: false,
    },
    global: {
      headers: {
        "X-Client-Info": "posti-web-app",
      },
    },
  })
}
