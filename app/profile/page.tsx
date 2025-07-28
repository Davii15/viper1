"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Edit,
  Save,
  MapPin,
  Globe,
  Calendar,
  FileText,
  Heart,
  Eye,
  CheckCircle,
  X,
  MoreVertical,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth, useRequireAuth } from "@/components/auth-provider"
import { getUserPosts, getUserLikedPosts, getUserBookmarkedPosts } from "@/lib/posts"
import { BlogCard } from "@/components/blog-card"
import { AvatarUpload } from "@/components/avatar-upload"
import { supabase } from "@/lib/supabase"
import type { Post } from "@/lib/supabase"

export default function Profile() {
  // ✅ Use the new auth system
  const { user, loading: authLoading } = useRequireAuth()
  const { signOut } = useAuth()

  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [postsLoading, setPostsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadError, setUploadError] = useState("")

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    location: "",
    website: "",
    avatar_url: "",
  })

  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalViews: 0,
    followers: 0,
    following: 0,
  })

  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([])
  const [likedLoading, setLikedLoading] = useState(false)
  const [bookmarkedLoading, setBookmarkedLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    setEditForm({
      full_name: user.full_name || "",
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
      avatar_url: user.avatar_url || "",
    })

    await Promise.all([loadUserPosts(user.id), loadUserStats(user.id)])
  }

  const loadUserPosts = async (userId: string) => {
    setPostsLoading(true)
    try {
      const { posts } = await getUserPosts(userId, 1, 50)
      setUserPosts(posts)
    } catch (error) {
      console.error("Error loading user posts:", error)
    } finally {
      setPostsLoading(false)
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      // Get user's posts and calculate stats
      const { data: postsData } = await supabase
        .from("posts")
        .select("likes_count, views_count, comments_count")
        .eq("user_id", userId)
        .eq("status", "published")

      // Get followers and following counts
      const [followersResponse, followingResponse] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
      ])

      const totalPosts = postsData?.length || 0
      const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0
      const totalViews = postsData?.reduce((sum, post) => sum + (post.views_count || 0), 0) || 0

      setStats({
        totalPosts,
        totalLikes,
        totalViews,
        followers: followersResponse.count || 0,
        following: followingResponse.count || 0,
      })
    } catch (error) {
      console.error("Error loading user stats:", error)
    }
  }

  // ✅ Handle avatar upload success
  const handleAvatarUploadSuccess = (url: string) => {
    console.log("✅ Avatar uploaded successfully:", url)
    setEditForm({ ...editForm, avatar_url: url })
    setUploadError("")
    setSuccess("Profile photo uploaded! Don't forget to save your changes.")
  }

  // ✅ Handle avatar upload error
  const handleAvatarUploadError = (error: string) => {
    console.error("❌ Avatar upload error:", error)
    setUploadError(error)
    setSuccess("")
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)
    setError("")
    setSuccess("")
    setUploadError("")

    try {
      console.log("💾 Saving profile updates...")

      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: editForm.full_name,
          bio: editForm.bio,
          location: editForm.location,
          website: editForm.website,
          avatar_url: editForm.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      console.log("✅ Profile updated successfully")
      setSuccess("Profile updated successfully! 🎉")
      setIsEditing(false)

      // ✅ Refresh user data in auth context
      // The AuthProvider will automatically sync the updated data
    } catch (error: any) {
      console.error("❌ Error updating profile:", error)
      setError(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  const loadLikedPosts = async () => {
    if (!user) return
    setLikedLoading(true)
    try {
      const { posts } = await getUserLikedPosts(user.id, 1, 50)
      setLikedPosts(posts)
    } catch (error) {
      console.error("Error loading liked posts:", error)
    } finally {
      setLikedLoading(false)
    }
  }

  const loadBookmarkedPosts = async () => {
    if (!user) return
    setBookmarkedLoading(true)
    try {
      const { posts } = await getUserBookmarkedPosts(user.id, 1, 50)
      setBookmarkedPosts(posts)
    } catch (error) {
      console.error("Error loading bookmarked posts:", error)
    } finally {
      setBookmarkedLoading(false)
    }
  }

  // ✅ Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading profile...</p>
        </motion.div>
      </div>
    )
  }

  // ✅ useRequireAuth will handle redirect if no user
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* African Pattern Background */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-2xl animate-pulse">👤</div>
        <div className="absolute top-20 right-20 text-xl animate-bounce">✨</div>
        <div className="absolute bottom-20 left-20 text-2xl animate-pulse">📊</div>
        <div className="absolute bottom-10 right-10 text-xl animate-bounce">🌟</div>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Profile</h1>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>

                {/* ✅ Profile Menu with Sign Out */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
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
                    <Link href="/settings">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setIsEditing(false)
                    setUploadError("")
                    setSuccess("")
                    // Reset form to original values
                    setEditForm({
                      full_name: user.full_name || "",
                      bio: user.bio || "",
                      location: user.location || "",
                      website: user.website || "",
                      avatar_url: user.avatar_url || "",
                    })
                  }}
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving} size="sm">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {uploadError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                {/* ✅ Avatar with Upload Functionality */}
                <div className="flex flex-col items-center space-y-2">
                  {isEditing ? (
                    <AvatarUpload
                      currentAvatarUrl={editForm.avatar_url}
                      userName={user.full_name}
                      onUploadSuccess={handleAvatarUploadSuccess}
                      onUploadError={handleAvatarUploadError}
                      disabled={saving}
                      size="lg"
                    />
                  ) : (
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-2xl">{user.full_name[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  {!isEditing ? (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h1 className="text-2xl font-bold">{user.full_name}</h1>
                        {user.verified && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">@{user.username}</p>
                      {user.bio && <p className="text-gray-700 dark:text-gray-300 mb-4">{user.bio}</p>}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {user.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        {user.website && (
                          <div className="flex items-center space-x-1">
                            <Globe className="w-4 h-4" />
                            <a
                              href={user.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {user.website}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <Input
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          placeholder="Your full name"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Bio</label>
                        <Textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                          rows={3}
                          disabled={saving}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Location</label>
                          <Input
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            placeholder="Your location"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Website</label>
                          <Input
                            value={editForm.website}
                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                            placeholder="https://yourwebsite.com"
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalPosts}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.totalLikes}</div>
                <div className="text-sm text-gray-600">Likes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalViews}</div>
                <div className="text-sm text-gray-600">Views</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.followers}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.following}</div>
                <div className="text-sm text-gray-600">Following</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Content Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs
            defaultValue="posts"
            onValueChange={(value) => {
              if (value === "liked" && likedPosts.length === 0) {
                loadLikedPosts()
              } else if (value === "bookmarks" && bookmarkedPosts.length === 0) {
                loadBookmarkedPosts()
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Posts ({stats.totalPosts})</span>
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Liked</span>
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Bookmarks</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-6">
                  {userPosts.map((post, index) => (
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
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No posts yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start sharing your stories with the community!
                  </p>
                  <Link href="/create">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                      Create Your First Post
                    </Button>
                  </Link>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="liked" className="mt-6">
              {likedLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : likedPosts.length > 0 ? (
                <div className="space-y-6">
                  {likedPosts.map((post, index) => (
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
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Liked Posts</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Posts you like will appear here</p>
                  <Button onClick={loadLikedPosts} variant="outline">
                    Refresh
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bookmarks" className="mt-6">
              {bookmarkedLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : bookmarkedPosts.length > 0 ? (
                <div className="space-y-6">
                  {bookmarkedPosts.map((post, index) => (
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
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Bookmarked Posts</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Posts you bookmark will appear here</p>
                  <Button onClick={loadBookmarkedPosts} variant="outline">
                    Refresh
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
