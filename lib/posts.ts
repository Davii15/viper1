import { createClient } from "./supabase/client"
import type { Post } from "./supabase"

const supabase = createClient()

export interface PostsResponse {
  posts: Post[]
  total: number
  hasMore: boolean
}

export interface PostFilters {
  category?: string
  postType?: string
  status?: string
  search?: string
  userId?: string
  page?: number
  limit?: number
}

// ✅ Enhanced post fetching with better error handling and consistency
export const getPosts = async (filters: PostFilters = {}): Promise<PostsResponse> => {
  try {
    console.log("📚 Fetching posts with filters:", filters)

    const { category, postType, status = "published", search, userId, page = 1, limit = 20 } = filters

    let query = supabase
      .from("posts")
      .select(`
        *,
        user:users!posts_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          verified
        ),
        categories:post_categories(
          category:categories(
            id,
            name,
            icon,
            color
          )
        )
      `)
      .eq("status", status)
      .order("created_at", { ascending: false })

    // Apply filters
    if (postType) {
      query = query.eq("post_type", postType)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    // Get total count first for pagination
    const { count } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", status)

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: posts, error } = await query

    if (error) {
      console.error("❌ Error fetching posts:", error)
      throw error
    }

    console.log(`✅ Fetched ${posts?.length || 0} posts`)

    // Get current user to check likes and bookmarks
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    let postsWithInteractions = posts || []

    if (currentUser && posts && posts.length > 0) {
      // Get user's likes and bookmarks efficiently
      const postIds = posts.map((p) => p.id)

      const [likesResponse, bookmarksResponse] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", currentUser.id).in("post_id", postIds),
        supabase.from("bookmarks").select("post_id").eq("user_id", currentUser.id).in("post_id", postIds),
      ])

      const likedPostIds = new Set(likesResponse.data?.map((l) => l.post_id) || [])
      const bookmarkedPostIds = new Set(bookmarksResponse.data?.map((b) => b.post_id) || [])

      postsWithInteractions = posts.map((post) => ({
        ...post,
        is_liked: likedPostIds.has(post.id),
        is_bookmarked: bookmarkedPostIds.has(post.id),
      }))
    }

    return {
      posts: postsWithInteractions,
      total: count || 0,
      hasMore: (posts?.length || 0) >= limit,
    }
  } catch (error) {
    console.error("❌ Error in getPosts:", error)
    return { posts: [], total: 0, hasMore: false }
  }
}

// ✅ Enhanced like functionality with proper error handling and duplicate prevention
export const likePost = async (postId: string): Promise<void> => {
  try {
    console.log("👍 Liking post:", postId)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Check if already liked to prevent duplicates
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    if (existingLike) {
      console.log("⚠️ Post already liked")
      return
    }

    // Add like with error handling
    const { error } = await supabase.from("likes").insert({
      user_id: user.id,
      post_id: postId,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("❌ Error inserting like:", error)
      throw error
    }

    // Update likes count using database function (with fallback)
    try {
      const { error: updateError } = await supabase.rpc("increment_likes_count", {
        post_id: postId,
      })

      if (updateError) {
        console.warn("⚠️ Database function failed, using manual update:", updateError)
        // Fallback to manual count update
        const { data: currentPost } = await supabase.from("posts").select("likes_count").eq("id", postId).single()
        if (currentPost) {
          await supabase
            .from("posts")
            .update({
              likes_count: (currentPost.likes_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", postId)
        }
      }
    } catch (funcError) {
      console.warn("⚠️ Function call failed, using manual update:", funcError)
      // Manual fallback
      const { data: currentPost } = await supabase.from("posts").select("likes_count").eq("id", postId).single()
      if (currentPost) {
        await supabase
          .from("posts")
          .update({
            likes_count: (currentPost.likes_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", postId)
      }
    }

    console.log("✅ Post liked successfully")
  } catch (error) {
    console.error("❌ Error liking post:", error)
    throw error
  }
}

// ✅ Enhanced unlike functionality
export const unlikePost = async (postId: string): Promise<void> => {
  try {
    console.log("👎 Unliking post:", postId)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Remove like
    const { error } = await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId)

    if (error) {
      console.error("❌ Error removing like:", error)
      throw error
    }

    // Update likes count using database function (with fallback)
    try {
      const { error: updateError } = await supabase.rpc("decrement_likes_count", {
        post_id: postId,
      })

      if (updateError) {
        console.warn("⚠️ Database function failed, using manual update:", updateError)
        // Fallback to manual count update
        const { data: currentPost } = await supabase.from("posts").select("likes_count").eq("id", postId).single()
        if (currentPost) {
          await supabase
            .from("posts")
            .update({
              likes_count: Math.max((currentPost.likes_count || 0) - 1, 0),
              updated_at: new Date().toISOString(),
            })
            .eq("id", postId)
        }
      }
    } catch (funcError) {
      console.warn("⚠️ Function call failed, using manual update:", funcError)
      // Manual fallback
      const { data: currentPost } = await supabase.from("posts").select("likes_count").eq("id", postId).single()
      if (currentPost) {
        await supabase
          .from("posts")
          .update({
            likes_count: Math.max((currentPost.likes_count || 0) - 1, 0),
            updated_at: new Date().toISOString(),
          })
          .eq("id", postId)
      }
    }

    console.log("✅ Post unliked successfully")
  } catch (error) {
    console.error("❌ Error unliking post:", error)
    throw error
  }
}

// ✅ Enhanced bookmark functionality with duplicate prevention
export const bookmarkPost = async (postId: string): Promise<void> => {
  try {
    console.log("🔖 Bookmarking post:", postId)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    if (existingBookmark) {
      console.log("⚠️ Post already bookmarked")
      return
    }

    // Add bookmark
    const { error } = await supabase.from("bookmarks").insert({
      user_id: user.id,
      post_id: postId,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("❌ Error inserting bookmark:", error)
      throw error
    }

    console.log("✅ Post bookmarked successfully")
  } catch (error) {
    console.error("❌ Error bookmarking post:", error)
    throw error
  }
}

// ✅ Enhanced unbookmark functionality
export const unbookmarkPost = async (postId: string): Promise<void> => {
  try {
    console.log("🔖❌ Unbookmarking post:", postId)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Remove bookmark
    const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("post_id", postId)

    if (error) {
      console.error("❌ Error removing bookmark:", error)
      throw error
    }

    console.log("✅ Post unbookmarked successfully")
  } catch (error) {
    console.error("❌ Error unbookmarking post:", error)
    throw error
  }
}

// ✅ Enhanced view tracking with better error handling
export const trackPostView = async (postId: string): Promise<void> => {
  try {
    console.log("👁️ Tracking post view:", postId)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Track view for both authenticated and anonymous users
    const viewData = {
      post_id: postId,
      user_id: user?.id || null,
      viewed_at: new Date().toISOString(),
    }

    // Use upsert to avoid duplicate views from same user
    const { error: viewError } = await supabase.from("post_views").upsert(viewData, {
      onConflict: user?.id ? "user_id,post_id" : "post_id",
      ignoreDuplicates: true,
    })

    if (viewError && viewError.code !== "23505") {
      // Ignore duplicate key errors
      console.warn("⚠️ Error tracking view:", viewError)
    }

    // Update views count using database function (with fallback)
    try {
      const { error: updateError } = await supabase.rpc("increment_views_count", {
        post_id: postId,
      })

      if (updateError) {
        console.warn("⚠️ Database function failed, using manual update:", updateError)
        // Fallback to manual count update
        const { data: currentPost } = await supabase.from("posts").select("views_count").eq("id", postId).single()
        if (currentPost) {
          await supabase
            .from("posts")
            .update({
              views_count: (currentPost.views_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", postId)
        }
      }
    } catch (funcError) {
      console.warn("⚠️ Function call failed, using manual update:", funcError)
      // Manual fallback
      const { data: currentPost } = await supabase.from("posts").select("views_count").eq("id", postId).single()
      if (currentPost) {
        await supabase
          .from("posts")
          .update({
            views_count: (currentPost.views_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", postId)
      }
    }

    console.log("✅ Post view tracked successfully")
  } catch (error) {
    console.error("❌ Error tracking post view:", error)
    // Don't throw error for view tracking failures - it shouldn't block navigation
  }
}

// ✅ Enhanced post creation with better error handling
export const createPost = async (postData: {
  title: string
  content: string
  excerpt?: string
  cover_image_url?: string
  post_type?: string
  categories?: string[]
}): Promise<Post> => {
  try {
    console.log("📝 Creating post with data:", postData)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { categories, ...postFields } = postData

    // Create the post with all required fields
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        ...postFields,
        user_id: user.id,
        excerpt: postData.excerpt || postData.content.substring(0, 200) + (postData.content.length > 200 ? "..." : ""),
        post_type: postData.post_type || "blog",
        status: "published",
        views_count: 0,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_trending: false,
        trending_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        user:users!posts_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          verified
        )
      `)
      .single()

    if (postError) {
      console.error("❌ Post creation error:", postError)
      throw postError
    }

    console.log("✅ Post created successfully:", post.id)

    // Add categories if provided
    if (categories && categories.length > 0 && post) {
      await addCategoriesToPost(post.id, categories)
    }

    return post
  } catch (error) {
    console.error("❌ Error creating post:", error)
    throw error
  }
}

// ✅ Helper function to add categories to post
const addCategoriesToPost = async (postId: string, categories: string[]) => {
  try {
    console.log("🏷️ Adding categories to post:", postId, categories)

    // Get or create category IDs
    const categoryPromises = categories.map(async (categoryName) => {
      // First try to find existing category
      const { data: existingCategory } = await supabase
        .from("categories")
        .select("id, name")
        .eq("name", categoryName)
        .single()

      if (existingCategory) {
        return existingCategory
      }

      // If not found, create new category
      const { data: newCategory, error: categoryError } = await supabase
        .from("categories")
        .insert({
          name: categoryName,
          icon: "📝", // Default icon
          color: "bg-gray-500", // Default color
          description: `Posts about ${categoryName}`,
          created_at: new Date().toISOString(),
        })
        .select("id, name")
        .single()

      if (categoryError) {
        console.error("❌ Category creation error:", categoryError)
        return null
      }

      return newCategory
    })

    const resolvedCategories = await Promise.all(categoryPromises)
    const validCategories = resolvedCategories.filter(Boolean)

    if (validCategories.length > 0) {
      const postCategories = validCategories.map((cat) => ({
        post_id: postId,
        category_id: cat.id,
        created_at: new Date().toISOString(),
      }))

      const { error: categoryLinkError } = await supabase.from("post_categories").insert(postCategories)

      if (categoryLinkError) {
        console.error("❌ Category linking error:", categoryLinkError)
        throw categoryLinkError
      }

      console.log("✅ Categories added successfully")
    }
  } catch (error) {
    console.error("❌ Error adding categories:", error)
    // Don't throw here as the post was created successfully
  }
}

// ✅ Get recommended posts for a user
export const getRecommendedPosts = async (userId: string): Promise<Post[]> => {
  try {
    console.log("🎯 Fetching recommended posts for user:", userId)

    // Get user's interests and followed users
    const [interestsResponse, followsResponse] = await Promise.all([
      supabase.from("user_interests").select("category_id").eq("user_id", userId),
      supabase.from("follows").select("following_id").eq("follower_id", userId),
    ])

    const categoryIds = interestsResponse.data?.map((i) => i.category_id) || []
    const followingIds = followsResponse.data?.map((f) => f.following_id) || []

    let query = supabase
      .from("posts")
      .select(`
        *,
        user:users!posts_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          verified
        ),
        categories:post_categories(
          category:categories(
            id,
            name,
            icon,
            color
          )
        )
      `)
      .eq("status", "published")
      .neq("user_id", userId) // Don't recommend own posts
      .order("trending_score", { ascending: false })
      .limit(10)

    // If user has interests or follows people, prioritize those
    if (categoryIds.length > 0 || followingIds.length > 0) {
      const conditions = []
      if (followingIds.length > 0) {
        conditions.push(`user_id.in.(${followingIds.join(",")})`)
      }
      if (categoryIds.length > 0) {
        // This is a simplified approach - in production you'd want a more sophisticated query
        query = query.or(conditions.join(","))
      }
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("❌ Error fetching recommended posts:", error)
      throw error
    }

    console.log(`✅ Fetched ${posts?.length || 0} recommended posts`)
    return posts || []
  } catch (error) {
    console.error("❌ Error in getRecommendedPosts:", error)
    return []
  }
}

// ✅ Get user's posts
export const getUserPosts = async (userId: string, page = 1, limit = 20): Promise<PostsResponse> => {
  return getPosts({ userId, page, limit })
}

// ✅ Get trending posts
export const getTrendingPosts = async (limit = 10): Promise<Post[]> => {
  try {
    console.log("🔥 Fetching trending posts")

    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        *,
        user:users!posts_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          verified
        ),
        categories:post_categories(
          category:categories(
            id,
            name,
            icon,
            color
          )
        )
      `)
      .eq("status", "published")
      .eq("is_trending", true)
      .order("trending_score", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("❌ Error fetching trending posts:", error)
      throw error
    }

    console.log(`✅ Fetched ${posts?.length || 0} trending posts`)
    return posts || []
  } catch (error) {
    console.error("❌ Error fetching trending posts:", error)
    return []
  }
}

// ✅ Get categories
export const getCategories = async () => {
  try {
    console.log("🏷️ Fetching categories")

    const { data: categories, error } = await supabase.from("categories").select("*").order("name")

    if (error) {
      console.error("❌ Error fetching categories:", error)
      throw error
    }

    console.log(`✅ Fetched ${categories?.length || 0} categories`)
    return categories || []
  } catch (error) {
    console.error("❌ Error fetching categories:", error)
    return []
  }
}

// ✅ Enhanced follow functionality
export const followUser = async (userId: string): Promise<void> => {
  try {
    console.log("👤➕ Following user:", userId)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    if (user.id === userId) {
      throw new Error("Cannot follow yourself")
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .single()

    if (existingFollow) {
      console.log("⚠️ Already following user")
      return
    }

    // Add follow
    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: userId,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("❌ Error following user:", error)
      throw error
    }

    console.log("✅ User followed successfully")
  } catch (error) {
    console.error("❌ Error following user:", error)
    throw error
  }
}

// ✅ Enhanced unfollow functionality
export const unfollowUser = async (userId: string): Promise<void> => {
  try {
    console.log("👤➖ Unfollowing user:", userId)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Remove follow
    const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId)

    if (error) {
      console.error("❌ Error unfollowing user:", error)
      throw error
    }

    console.log("✅ User unfollowed successfully")
  } catch (error) {
    console.error("❌ Error unfollowing user:", error)
    throw error
  }
}

// ✅ Check if current user follows another user
export const checkIfFollowing = async (userId: string): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("❌ Error checking follow status:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("❌ Error checking follow status:", error)
    return false
  }
}

// ✅ Get user's followers
export const getUserFollowers = async (userId: string) => {
  try {
    console.log("👥 Fetching followers for user:", userId)

    const { data, error } = await supabase
      .from("follows")
      .select(`
        created_at,
        follower:users!follows_follower_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          verified
        )
      `)
      .eq("following_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching followers:", error)
      throw error
    }

    console.log(`✅ Fetched ${data?.length || 0} followers`)
    return data || []
  } catch (error) {
    console.error("❌ Error fetching followers:", error)
    return []
  }
}

// ✅ Get users that a user follows
export const getUserFollowing = async (userId: string) => {
  try {
    console.log("👥 Fetching following for user:", userId)

    const { data, error } = await supabase
      .from("follows")
      .select(`
        created_at,
        following:users!follows_following_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          verified
        )
      `)
      .eq("follower_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching following:", error)
      throw error
    }

    console.log(`✅ Fetched ${data?.length || 0} following`)
    return data || []
  } catch (error) {
    console.error("❌ Error fetching following:", error)
    return []
  }
}

// ✅ Get posts from users that current user follows
export const getFollowingPosts = async (page = 1, limit = 20): Promise<PostsResponse> => {
  try {
    console.log("👥 Fetching following posts")

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { posts: [], total: 0, hasMore: false }

    // Get users that current user follows
    const { data: following } = await supabase.from("follows").select("following_id").eq("follower_id", user.id)

    if (!following || following.length === 0) {
      console.log("⚠️ User is not following anyone")
      return { posts: [], total: 0, hasMore: false }
    }

    const followingIds = following.map((f) => f.following_id)

    // Get posts from followed users
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        *,
        user:users!posts_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          verified
        ),
        categories:post_categories(
          category:categories(
            id,
            name,
            icon,
            color
          )
        )
      `)
      .in("user_id", followingIds)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("❌ Error fetching following posts:", error)
      throw error
    }

    // Get user interactions
    let postsWithInteractions = posts || []
    if (posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id)
      const [likesResponse, bookmarksResponse] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
        supabase.from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      ])

      const likedPostIds = new Set(likesResponse.data?.map((l) => l.post_id) || [])
      const bookmarkedPostIds = new Set(bookmarksResponse.data?.map((b) => b.post_id) || [])

      postsWithInteractions = posts.map((post) => ({
        ...post,
        is_liked: likedPostIds.has(post.id),
        is_bookmarked: bookmarkedPostIds.has(post.id),
      }))
    }

    console.log(`✅ Fetched ${postsWithInteractions.length} following posts`)

    return {
      posts: postsWithInteractions,
      total: posts?.length || 0,
      hasMore: (posts?.length || 0) >= limit,
    }
  } catch (error) {
    console.error("❌ Error fetching following posts:", error)
    return { posts: [], total: 0, hasMore: false }
  }
}

// ✅ Get users who liked a post
export const getPostLikes = async (postId: string) => {
  try {
    console.log("👍 Fetching post likes for:", postId)

    const { data, error } = await supabase
      .from("likes")
      .select(`
        created_at,
        user:users!likes_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          verified
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching post likes:", error)
      throw error
    }

    console.log(`✅ Fetched ${data?.length || 0} likes`)
    return data || []
  } catch (error) {
    console.error("❌ Error fetching post likes:", error)
    return []
  }
}

// ✅ Get user's liked posts
export const getUserLikedPosts = async (userId: string, page = 1, limit = 20): Promise<PostsResponse> => {
  try {
    console.log("❤️ Fetching liked posts for user:", userId)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: likes, error } = await supabase
      .from("likes")
      .select(`
        created_at,
        post:posts!likes_post_id_fkey(
          *,
          user:users!posts_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            verified
          ),
          categories:post_categories(
            category:categories(
              id,
              name,
              icon,
              color
            )
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("❌ Error fetching liked posts:", error)
      throw error
    }

    const posts =
      likes?.map((like) => ({
        ...like.post,
        is_liked: true,
        is_bookmarked: false, // We'd need to check this separately
      })) || []

    console.log(`✅ Fetched ${posts.length} liked posts`)

    return {
      posts,
      total: posts.length,
      hasMore: posts.length >= limit,
    }
  } catch (error) {
    console.error("❌ Error fetching liked posts:", error)
    return { posts: [], total: 0, hasMore: false }
  }
}

// ✅ Get user's bookmarked posts
export const getUserBookmarkedPosts = async (userId: string, page = 1, limit = 20): Promise<PostsResponse> => {
  try {
    console.log("🔖 Fetching bookmarked posts for user:", userId)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: bookmarks, error } = await supabase
      .from("bookmarks")
      .select(`
        created_at,
        post:posts!bookmarks_post_id_fkey(
          *,
          user:users!posts_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            verified
          ),
          categories:post_categories(
            category:categories(
              id,
              name,
              icon,
              color
            )
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("❌ Error fetching bookmarked posts:", error)
      throw error
    }

    const posts =
      bookmarks?.map((bookmark) => ({
        ...bookmark.post,
        is_liked: false, // We'd need to check this separately
        is_bookmarked: true,
      })) || []

    console.log(`✅ Fetched ${posts.length} bookmarked posts`)

    return {
      posts,
      total: posts.length,
      hasMore: posts.length >= limit,
    }
  } catch (error) {
    console.error("❌ Error fetching bookmarked posts:", error)
    return { posts: [], total: 0, hasMore: false }
  }
}
