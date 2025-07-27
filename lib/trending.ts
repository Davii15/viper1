import { createClient } from "@/lib/supabase/client"

export interface TrendingTopic {
  id: string
  name: string
  post_count: number
  engagement_score: number
  growth_rate: number
}

export interface TrendingPost {
  id: string
  title: string
  slug: string
  views_count: number
  likes_count: number
  comments_count: number
  created_at: string
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
}

export async function getTrendingTopics(limit = 5): Promise<TrendingTopic[]> {
  try {
    const supabase = createClient()

    // Get trending topics based on recent post activity
    const { data: topics, error } = await supabase.rpc("get_trending_topics", { topic_limit: limit })

    if (error) {
      console.error("Error fetching trending topics:", error)
      // Return fallback topics if database function fails
      return [
        { id: "1", name: "Ubuntu Philosophy", post_count: 15, engagement_score: 85, growth_rate: 12 },
        { id: "2", name: "African Tech", post_count: 23, engagement_score: 92, growth_rate: 18 },
        { id: "3", name: "Startup Stories", post_count: 18, engagement_score: 78, growth_rate: 8 },
        { id: "4", name: "Cultural Heritage", post_count: 12, engagement_score: 88, growth_rate: 15 },
        { id: "5", name: "Innovation", post_count: 20, engagement_score: 82, growth_rate: 10 },
      ]
    }

    return topics || []
  } catch (error) {
    console.error("Error in getTrendingTopics:", error)
    return []
  }
}

export async function getTrendingPosts(limit = 10): Promise<TrendingPost[]> {
  try {
    const supabase = createClient()

    // Get trending posts based on engagement in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        slug,
        views_count,
        likes_count,
        comments_count,
        created_at,
        user:users!posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("status", "published")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("engagement_score", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching trending posts:", error)
      return []
    }

    return posts || []
  } catch (error) {
    console.error("Error in getTrendingPosts:", error)
    return []
  }
}

// Calculate engagement score for a post
export function calculateEngagementScore(post: {
  views_count: number
  likes_count: number
  comments_count: number
  created_at: string
}): number {
  const now = new Date()
  const postDate = new Date(post.created_at)
  const hoursOld = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)

  // Weighted engagement score with time decay
  const baseScore = post.likes_count * 3 + post.comments_count * 5 + post.views_count * 0.1
  const timeDecay = Math.max(0.1, 1 - hoursOld / (24 * 7)) // Decay over 7 days

  return Math.round(baseScore * timeDecay)
}
