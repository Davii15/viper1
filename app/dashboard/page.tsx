"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  Search,
  Plus,
  BookOpen,
  Settings,
  LogOut,
  Home,
  Compass,
  PenTool,
  UserIcon,
  Loader2,
  RefreshCw,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  getPosts,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  trackPostView,
  getFollowingPosts,
} from "@/lib/posts"
import { BlogCard } from "@/components/blog-card"
import { GreetingBanner } from "@/components/greeting-banner"
import { ContentFilters } from "@/components/content-filters"
import { LayoutSwitcher } from "@/components/layout-switcher"
import { DashboardStats } from "@/components/dashboard-stats"
import { ThemeSelector } from "@/components/theme-selector"
import { DebugInfo } from "@/components/debug-info"
import { TrendingTopics } from "@/components/trending-topics"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("for-you")
  const [layout, setLayout] = useState<"magazine" | "card" | "minimal">("magazine")
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filters, setFilters] = useState({})
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})

  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    if (user) {
      refreshPosts()
    }
  }, [user, activeTab, filters])

  useEffect(() => {
    handleSearch()
  }, [searchQuery, posts])

  // ✅ Simplified auth check - direct Supabase calls
  const checkAuthAndLoadData = async () => {
    try {
      console.log("🔍 Checking authentication...")

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ Session error:", error)
        window.location.href = "/auth/signin"
        return
      }

      if (!session?.user) {
        console.warn("⚠️ No session found, redirecting to signin")
        window.location.href = "/auth/signin"
        return
      }

      console.log("✅ Session found for:", session.user.email)

      // ✅ Get user profile directly
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()

      let userData = profile

      // ✅ Create profile if it doesn't exist
      if (profileError && profileError.code === "PGRST116") {
        console.log("📝 Creating user profile...")
        const newProfile = {
          id: session.user.id,
          email: session.user.email!,
          username: session.user.user_metadata.username || session.user.email!.split("@")[0],
          full_name: session.user.user_metadata.full_name || "User",
          country: session.user.user_metadata.country,
          avatar_url: session.user.user_metadata.avatar_url,
          verified: false,
          created_at: session.user.created_at,
          updated_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        }

        const { data: createdProfile, error: createError } = await supabase
          .from("users")
          .insert(newProfile)
          .select()
          .single()

        if (createError) {
          console.warn("⚠️ Profile creation failed, using session data:", createError)
          userData = newProfile
        } else {
          userData = createdProfile
        }
      } else if (profileError) {
        console.warn("⚠️ Profile fetch failed, using session data:", profileError)
        userData = {
          id: session.user.id,
          email: session.user.email!,
          username: session.user.user_metadata.username || session.user.email!.split("@")[0],
          full_name: session.user.user_metadata.full_name || "User",
          country: session.user.user_metadata.country,
          avatar_url: session.user.user_metadata.avatar_url,
          verified: false,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || session.user.created_at,
          last_seen: new Date().toISOString(),
        }
      }

      console.log("✅ User data loaded:", userData.email)
      setUser(userData)

      // ✅ Update last seen
      supabase
        .from("users")
        .update({
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)
        .then(() => console.log("✅ Last seen updated"))
        .catch((err) => console.warn("⚠️ Last seen update failed:", err))
    } catch (error) {
      console.error("❌ Error in checkAuthAndLoadData:", error)
      window.location.href = "/auth/signin"
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async (page = 1, append = false) => {
    if (!user) return

    if (!append) setPostsLoading(true)

    try {
      let postsResponse

      if (activeTab === "following") {
        postsResponse = await getFollowingPosts(page, 20)
      } else {
        const postFilters = {
          ...filters,
          page,
          limit: 20,
        }
        postsResponse = await getPosts(postFilters)
      }

      console.log("Loaded posts:", postsResponse.posts.length)

      if (append) {
        setPosts((prev) => [...prev, ...postsResponse.posts])
      } else {
        setPosts(postsResponse.posts)
        setCurrentPage(1)
      }

      setHasMore(postsResponse.hasMore)
    } catch (error) {
      console.error("Error loading posts:", error)
      if (!append) {
        setPosts([])
      }
    } finally {
      setPostsLoading(false)
      setRefreshing(false)
    }
  }

  const refreshPosts = async () => {
    console.log("Refreshing posts...")
    setRefreshing(true)
    await loadPosts()
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts)
      return
    }

    const filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.user?.username.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    setFilteredPosts(filtered)
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return
    if (actionLoading[`like-${postId}`]) return

    setActionLoading((prev) => ({ ...prev, [`like-${postId}`]: true }))

    try {
      console.log(`${isLiked ? "Unliking" : "Liking"} post:`, postId)

      if (isLiked) {
        await unlikePost(postId)
      } else {
        await likePost(postId)
      }

      const updatePosts = (posts: any[]) =>
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: !isLiked,
                likes_count: post.likes_count + (isLiked ? -1 : 1),
              }
            : post,
        )

      setPosts(updatePosts)
      setFilteredPosts(updatePosts)

      console.log(`✅ ${isLiked ? "Unliked" : "Liked"} post successfully`)
    } catch (error) {
      console.error("❌ Error toggling like:", error)
      alert(`Failed to ${isLiked ? "unlike" : "like"} post. Please try again.`)
    } finally {
      setActionLoading((prev) => ({ ...prev, [`like-${postId}`]: false }))
    }
  }

  const handleBookmark = async (postId: string, isBookmarked: boolean) => {
    if (!user) return
    if (actionLoading[`bookmark-${postId}`]) return

    setActionLoading((prev) => ({ ...prev, [`bookmark-${postId}`]: true }))

    try {
      console.log(`${isBookmarked ? "Unbookmarking" : "Bookmarking"} post:`, postId)

      if (isBookmarked) {
        await unbookmarkPost(postId)
      } else {
        await bookmarkPost(postId)
      }

      const updatePosts = (posts: any[]) =>
        posts.map((post) => (post.id === postId ? { ...post, is_bookmarked: !isBookmarked } : post))

      setPosts(updatePosts)
      setFilteredPosts(updatePosts)

      console.log(`✅ ${isBookmarked ? "Unbookmarked" : "Bookmarked"} post successfully`)
    } catch (error) {
      console.error("❌ Error toggling bookmark:", error)
      alert(`Failed to ${isBookmarked ? "unbookmark" : "bookmark"} post. Please try again.`)
    } finally {
      setActionLoading((prev) => ({ ...prev, [`bookmark-${postId}`]: false }))
    }
  }

  const handlePostView = async (postId: string) => {
    try {
      console.log("📊 Tracking post view:", postId)
      await trackPostView(postId)
      console.log("✅ Post view tracked successfully")
      router.push(`/post/${postId}`)
    } catch (error) {
      console.error("❌ Error tracking view:", error)
      router.push(`/post/${postId}`)
    }
  }

  const handleSignOut = async () => {
    try {
      console.log("🚪 Signing out...")
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      window.location.href = "/"
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadPosts()
  }

  const loadMorePosts = () => {
    if (hasMore && !postsLoading) {
      loadPosts(currentPage + 1, true)
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log("Tab became visible, refreshing posts...")
        refreshPosts()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user])

  // ✅ Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading your dashboard...</p>
        </motion.div>
      </div>
    )
  }

  // ✅ This should never show since we redirect above
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">Redirecting to sign in...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* African Pattern Background */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-2xl animate-pulse">🌍</div>
        <div className="absolute top-20 right-20 text-xl animate-bounce">🦁</div>
        <div className="absolute bottom-20 left-20 text-2xl animate-pulse">🌴</div>
        <div className="absolute bottom-10 right-10 text-xl animate-bounce">🐘</div>
        <div className="absolute top-1/2 left-1/4 text-lg animate-pulse">🦒</div>
        <div className="absolute top-1/3 right-1/3 text-lg animate-bounce">🌺</div>
      </div>

      {/* Navigation Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Posti
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Compass className="w-4 h-4" />
                  <span>Explore</span>
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </Button>
              </Link>
              <Link href="/create">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <PenTool className="w-4 h-4" />
                  <span>Write</span>
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block font-medium">{user.full_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Stats */}
            <DashboardStats userId={user.id} />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/create">
                  <Button className="w-full justify-start bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Messages
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Compass className="w-4 h-4 mr-2" />
                    Explore
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <UserIcon className="w-4 h-4 mr-2" />
                    My Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Theme Selector */}
            <ThemeSelector />

            {/* ✅ Real Trending Topics Component */}
            <TrendingTopics />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Greeting Banner */}
            <GreetingBanner user={user} />

            {/* Debug Info - Remove in production */}
            <DebugInfo
              data={{
                postsCount: posts.length,
                filteredPostsCount: filteredPosts.length,
                loading: postsLoading,
                filters,
                activeTab,
                user: user ? { id: user.id, username: user.username } : null,
              }}
              title="Dashboard State"
            />

            {/* Content Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="for-you">For You</TabsTrigger>
                  <TabsTrigger value="following">Following</TabsTrigger>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshPosts}
                  disabled={refreshing}
                  className="bg-white hover:bg-gray-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
                <LayoutSwitcher currentLayout={layout} onLayoutChange={setLayout} />
              </div>
            </div>

            {/* Content Filters */}
            <ContentFilters onFiltersChange={handleFiltersChange} />

            {/* Mobile Search */}
            <div className="md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {postsLoading && !refreshing ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : filteredPosts.length > 0 ? (
                <>
                  {layout === "card" ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {filteredPosts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * (index % 4) }}
                        >
                          <BlogCard
                            post={post}
                            onLike={handleLike}
                            onBookmark={handleBookmark}
                            onView={handlePostView}
                            layout="card"
                            isLikeLoading={actionLoading[`like-${post.id}`]}
                            isBookmarkLoading={actionLoading[`bookmark-${post.id}`]}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    filteredPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * (index % 4) }}
                      >
                        <BlogCard
                          post={post}
                          onLike={handleLike}
                          onBookmark={handleBookmark}
                          onView={handlePostView}
                          layout={layout}
                          isLikeLoading={actionLoading[`like-${post.id}`]}
                          isBookmarkLoading={actionLoading[`bookmark-${post.id}`]}
                        />
                      </motion.div>
                    ))
                  )}

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center py-6">
                      <Button
                        onClick={loadMorePosts}
                        disabled={postsLoading}
                        variant="outline"
                        className="flex items-center space-x-2 bg-transparent"
                      >
                        {postsLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span>{postsLoading ? "Loading..." : "Load More Posts"}</span>
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No posts found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery
                      ? `No results for "${searchQuery}"`
                      : "Be the first to share your story with the Ubuntu community!"}
                  </p>
                  <Link href="/create">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Post
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t z-30">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2">
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2">
              <Compass className="w-5 h-5" />
              <span className="text-xs">Explore</span>
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Chat</span>
            </Button>
          </Link>
          <Link href="/create">
            <Button variant="ghost" className="flex flex-col items-center space-x-2 h-auto py-2">
              <Plus className="w-5 h-5" />
              <span className="text-xs">Create</span>
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2">
              <UserIcon className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
