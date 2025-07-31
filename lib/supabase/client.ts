import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Export a singleton instance for immediate use
export const supabaseBrowser = createClient()

// Define a type for your user profile, assuming it's in a 'users' table
export type User = Database["public"]["Tables"]["users"]["Row"]
