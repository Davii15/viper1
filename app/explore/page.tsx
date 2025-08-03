"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, TrendingUp, Hash, Star, FlameIcon as Fire, ArrowLeft, Filter, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import type { Post, Category } from "@/lib/supabase"

// Import the posts functions
import {
  getPosts,
  getTrendingPosts,
  getCategories,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
} from "@/lib/posts"

export default function Explore() {
  // ✅ Use centralized auth system (optional auth for explore)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("trending")
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch()
    } else {
      setFilteredPosts(trendingPosts)
    }
  }, [searchQuery, trendingPosts])

  const loadData = async () => {
    try {
      console.log("🔍 Loading explore data...")
      await Promise.all([loadTrendingPosts(), loadCategories()])
    } catch (error) {
      console.error("❌ Error loading explore data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTrendingPosts = async () => {
    try {
      console.log("📈 Loading trending posts...")

      const posts = await getTrendingPosts(20)
      setTrendingPosts(posts)
      setFilteredPosts(posts)
      console.log(`✅ Loaded ${posts.length} trending posts`)
    } catch (error) {
      console.error("❌ Error loading trending posts:", error)
      setTrendingPosts([])
      setFilteredPosts([])
    }
  }

  const loadCategories = async () => {
    try {
      console.log("🏷️ Loading categories...")

      const categoriesData = await getCategories()
      setCategories(categoriesData)
      console.log(`✅ Loaded ${categoriesData.length} categories`)
    } catch (error) {
      console.error("❌ Error loading categories:", error)
      // Keep the default categories as fallback
      const defaultCategories = [
        {
          id: "1",
          name: "Technology",
          icon: "💻",
          color: "#3B82F6",
          description: "Tech news and tutorials",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Lifestyle",
          icon: "🌟",
          color: "#F59E0B",
          description: "Life tips and experiences",
          created_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Travel",
          icon: "✈️",
          color: "#10B981",
          description: "Travel stories and guides",
          created_at: new Date().toISOString(),
        },
        {
          id: "4",
          name: "Food",
          icon: "🍽️",
          color: "#EF4444",
          description: "Recipes and food culture",
          created_at: new Date().toISOString(),
        },
        {
          id: "5",
          name: "Business",
          icon: "💼",
          color: "#8B5CF6",
          description: "Business insights and tips",
          created_at: new Date().toISOString(),
        },
      ]
      setCategories(defaultCategories as Category[])
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearchLoading(true)
    try {
      console.log("🔍 Searching posts for:", searchQuery)

      const response = await getPosts({
        search: searchQuery,
        limit: 20,
        page: 1,
      })

      setFilteredPosts(response.posts)
      console.log(`✅ Found ${response.posts.length} posts for search`)
    } catch (error) {
      console.error("❌ Error searching posts:", error)
      setFilteredPosts([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) {
      router.push("/auth/signin")
      return
    }

    try {
      if (isLiked) {
        await unlikePost(postId)
      } else {
        await likePost(postId)
      }

      // Update local state
      const updatePosts = (posts: Post[]) =>
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: !isLiked,
                likes_count: post.likes_count + (isLiked ? -1 : 1),
              }
            : post,
        )

      setTrendingPosts(updatePosts)
      setFilteredPosts(updatePosts)
    } catch (error) {
      console.error("❌ Error toggling like:", error)
    }
  }

  const handleBookmark = async (postId: string, isBookmarked: boolean) => {
    if (!user) {
      router.push("/auth/signin")
      return
    }

    try {
      if (isBookmarked) {
        await unbookmarkPost(postId)
      } else {
        await bookmarkPost(postId)
      }

      // Update local state
      const updatePosts = (posts: Post[]) =>
        posts.map((post) => (post.id === postId ? { ...post, is_bookmarked: !isBookmarked } : post))

      setTrendingPosts(updatePosts)
      setFilteredPosts(updatePosts)
    } catch (error) {
      console.error("❌ Error toggling bookmark:", error)
    }
  }

  const handlePostView = (postId: string) => {
    router.push(`/post/${postId}`)
  }

  if (loading && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading explore page...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* African Pattern Background */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-2xl animate-pulse">🔍</div>
        <div className="absolute top-20 right-20 text-xl animate-bounce">🌟</div>
        <div className="absolute bottom-20 left-20 text-2xl animate-pulse">📈</div>
        <div className="absolute bottom-10 right-10 text-xl animate-bounce">👥</div>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="touch-target">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Explore</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="touch-target">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search posts, users, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 text-lg bg-white shadow-sm touch-target"
            />
            {searchLoading && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
            )}
          </div>
        </motion.div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="trending" className="flex items-center space-x-2 touch-target">
              <TrendingUp className="w-4 h-4" />
              <span>Trending</span>
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center space-x-2 touch-target">
              <Hash className="w-4 h-4" />
              <span>Topics</span>
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center space-x-2 touch-target">
              <Star className="w-4 h-4" />
              <span>Featured</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center">
                    <Fire className="w-6 h-6 mr-2 text-orange-500" />
                    Trending Now
                  </h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="touch-target bg-transparent">
                      Today
                    </Button>
                    <Button variant="ghost" size="sm" className="touch-target">
                      This Week
                    </Button>
                    <Button variant="ghost" size="sm" className="touch-target">
                      This Month
                    </Button>
                  </div>
                </div>

                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handlePostView(post.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            {post.cover_image_url && (
                              <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={post.cover_image_url || "/placeholder.svg"}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                  {post.user?.full_name?.[0] || "U"}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{post.user?.full_name || "Unknown User"}</div>
                                  <div className="text-xs text-gray-500">@{post.user?.username || "unknown"}</div>
                                </div>
                              </div>
                              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
                              {post.excerpt && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                  {post.excerpt}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleLike(post.id, post.is_liked || false)
                                    }}
                                    className="flex items-center space-x-1 hover:text-red-500 transition-colors touch-target"
                                  >
                                    <span>❤️</span>
                                    <span>{post.likes_count || 0}</span>
                                  </button>
                                  <span className="flex items-center space-x-1">
                                    <span>👁️</span>
                                    <span>{post.views_count || 0}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <span>💬</span>
                                    <span>{post.comments_count || 0}</span>
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleBookmark(post.id, post.is_bookmarked || false)
                                    }}
                                    className="hover:text-blue-500 transition-colors touch-target"
                                  >
                                    🔖
                                  </button>
                                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No posts found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchQuery ? `No results for "${searchQuery}"` : "No trending posts available"}
                    </p>
                    {user ? (
                      <Link href="/create">
                        <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 touch-target">
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Post
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth/signin">
                        <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 touch-target">
                          Sign In to Create Posts
                        </Button>
                      </Link>
                    )}
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Platform Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Posts</span>
                        <span className="font-semibold">{filteredPosts.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Categories</span>
                        <span className="font-semibold">{categories.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Today</span>
                        <span className="font-semibold text-green-600">Live</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Popular Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categories.slice(0, 5).map((category, index) => (
                        <Button key={category.id} variant="ghost" className="w-full justify-start text-sm touch-target">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs mr-3">
                            {category.icon}
                          </span>
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Call to Action */}
                {!user && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Join Posti Today!</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Create your global Ubuntu account and start sharing your stories with the world.
                      </p>
                      <div className="space-y-2">
                        <Link href="/auth/signup">
                          <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 touch-target">
                            Create Account
                          </Button>
                        </Link>
                        <Link href="/auth/signin">
                          <Button variant="outline" className="w-full touch-target bg-transparent">
                            Sign In
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="topics">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer touch-target">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <h3 className="font-semibold mb-2">{category.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{category.description}</p>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="featured">
            <div className="text-center py-16">
              <Star className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Featured Content</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Discover hand-picked content from our editorial team and community favorites.
              </p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 touch-target">
                Coming Soon
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
