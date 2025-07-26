"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, TrendingUp, Hash, Star, FlameIcon as Fire, ArrowLeft, Filter, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getTrendingPosts, getCategories, getPosts } from "@/lib/posts"
import { BlogCard } from "@/components/blog-card"
import type { Post, User } from "@/lib/supabase"

export default function Explore() {
  const [user, setUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("trending")
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch()
    } else {
      setFilteredPosts(trendingPosts)
    }
  }, [searchQuery, trendingPosts])

  const checkAuthAndLoadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      await Promise.all([loadTrendingPosts(), loadCategories()])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTrendingPosts = async () => {
    try {
      const posts = await getTrendingPosts(20)
      setTrendingPosts(posts)
      setFilteredPosts(posts)
    } catch (error) {
      console.error("Error loading trending posts:", error)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearchLoading(true)
    try {
      const { posts } = await getPosts({
        search: searchQuery,
        limit: 20,
      })
      setFilteredPosts(posts)
    } catch (error) {
      console.error("Error searching posts:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    // TODO: Implement like functionality
    console.log("Like functionality to be implemented")
  }

  const handleBookmark = async (postId: string, isBookmarked: boolean) => {
    // TODO: Implement bookmark functionality
    console.log("Bookmark functionality to be implemented")
  }

  const handlePostView = (postId: string) => {
    router.push(`/post/${postId}`)
  }

  if (loading) {
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
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Explore</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
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
              className="pl-12 py-3 text-lg bg-white shadow-sm"
            />
            {searchLoading && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
            )}
          </div>
        </motion.div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="trending" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Trending</span>
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center space-x-2">
              <Hash className="w-4 h-4" />
              <span>Topics</span>
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center space-x-2">
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
                    <Button variant="outline" size="sm">
                      Today
                    </Button>
                    <Button variant="ghost" size="sm">
                      This Week
                    </Button>
                    <Button variant="ghost" size="sm">
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
                      <BlogCard
                        post={post}
                        onLike={handleLike}
                        onBookmark={handleBookmark}
                        onView={handlePostView}
                        layout="magazine"
                      />
                    </motion.div>
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No posts found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery ? `No results for "${searchQuery}"` : "No trending posts available"}
                    </p>
                    <Link href="/create">
                      <Button className="bg-gradient-to-r from-orange-500 to-red-500">Create First Post</Button>
                    </Link>
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
                        <span className="font-semibold">Live</span>
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
                        <Button key={category.id} variant="ghost" className="w-full justify-start text-sm">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs mr-3">
                            {category.icon}
                          </span>
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <h3 className="font-semibold mb-2">{category.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{category.description}</p>
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
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Discover hand-picked content from our editorial team and community favorites.
              </p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Coming Soon
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
