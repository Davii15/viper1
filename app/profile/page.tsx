"use client"

import type React from "react"

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
  Camera,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth, useRequireAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import type { Post } from "@/lib/supabase"

// Import the posts functions
import {
  getUserPosts,
  getUserLikedPosts,
  getUserBookmarkedPosts,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  trackPostView,
} from "@/lib/posts"

export default function Profile() {
  // ✅ Use the centralized auth system
  const { user, loading: authLoading } = useRequireAuth()
  const { signOut, refreshUser } = useAuth()

  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [postsLoading, setPostsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [avatarUploading, setAvatarUploading] = useState(false)

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

  // ✅ Load user data when user is available
  useEffect(() => {
    if (user && !authLoading) {
      loadUserData()
    }
  }, [user, authLoading])

  const loadUserData = async () => {
    if (!user) return

    console.log("🔄 Loading user profile data...")

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
      console.log("📝 Loading user posts...")
      const response = await getUserPosts(userId, 1, 50)
      setUserPosts(response.posts || [])
      console.log(`✅ Loaded ${response.posts?.length || 0} user posts`)
    } catch (error) {
      console.error("❌ Error loading user posts:", error)
      setUserPosts([])
    } finally {
      setPostsLoading(false)
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      console.log("📊 Loading user stats...")

      // Get user's posts and calculate stats
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("likes_count, views_count, comments_count")
        .eq("user_id", userId)
        .eq("status", "published")

      if (postsError) throw postsError

      // Get followers and following counts (if tables exist)
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

      console.log("✅ User stats loaded:", { totalPosts, totalLikes, totalViews })
    } catch (error) {
      console.error("❌ Error loading user stats:", error)
      // Set default stats on error
      setStats({
        totalPosts: userPosts.length,
        totalLikes: 0,
        totalViews: 0,
        followers: 0,
        following: 0,
      })
    }
  }

  // ✅ Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be less than 5MB")
      return
    }

    setAvatarUploading(true)
    setUploadError("")

    try {
      console.log("📸 Uploading avatar...")

      // Create unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("media").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath)

      // Update form state
      setEditForm({ ...editForm, avatar_url: publicUrl })
      setSuccess("Profile photo uploaded! Don't forget to save your changes.")

      console.log("✅ Avatar uploaded successfully:", publicUrl)
    } catch (error: any) {
      console.error("❌ Avatar upload error:", error)
      setUploadError(error.message || "Failed to upload avatar")
    } finally {
      setAvatarUploading(false)
    }
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
          full_name: editForm.full_name.trim(),
          bio: editForm.bio.trim() || null,
          location: editForm.location.trim() || null,
          website: editForm.website.trim() || null,
          avatar_url: editForm.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      console.log("✅ Profile updated successfully")
      setSuccess("Profile updated successfully! 🎉")
      setIsEditing(false)

      // ✅ Refresh user data in auth context
      await refreshUser()
    } catch (error: any) {
      console.error("❌ Error updating profile:", error)
      setError(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return

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

      setUserPosts(updatePosts)
      setLikedPosts(updatePosts)
    } catch (error) {
      console.error("❌ Error toggling like:", error)
    }
  }

  const handleBookmark = async (postId: string, isBookmarked: boolean) => {
    if (!user) return

    try {
      if (isBookmarked) {
        await unbookmarkPost(postId)
      } else {
        await bookmarkPost(postId)
      }

      // Update local state
      const updatePosts = (posts: Post[]) =>
        posts.map((post) => (post.id === postId ? { ...post, is_bookmarked: !isBookmarked } : post))

      setUserPosts(updatePosts)
      setBookmarkedPosts(updatePosts)
    } catch (error) {
      console.error("❌ Error toggling bookmark:", error)
    }
  }

  const handlePostView = async (postId: string) => {
    try {
      await trackPostView(postId)
      router.push(`/post/${postId}`)
    } catch (error) {
      console.error("❌ Error tracking view:", error)
      router.push(`/post/${postId}`)
    }
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
      const response = await getUserLikedPosts(user.id, 1, 50)
      setLikedPosts(response.posts || [])
    } catch (error) {
      console.error("Error loading liked posts:", error)
      setLikedPosts([])
    } finally {
      setLikedLoading(false)
    }
  }

  const loadBookmarkedPosts = async () => {
    if (!user) return
    setBookmarkedLoading(true)
    try {
      const response = await getUserBookmarkedPosts(user.id, 1, 50)
      setBookmarkedPosts(response.posts || [])
    } catch (error) {
      console.error("Error loading bookmarked posts:", error)
      setBookmarkedPosts([])
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
              <Button variant="ghost" size="sm" className="touch-target">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Profile</h1>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="touch-target">
                  <Edit className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </Button>

                {/* ✅ Profile Menu with Sign Out */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="touch-target">
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
                  className="touch-target"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="touch-target">
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
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                {/* ✅ Avatar with Upload Functionality */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={editForm.avatar_url || user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-2xl">{user.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          {avatarUploading ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <Camera className="w-6 h-6 text-white" />
                          )}
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={avatarUploading || saving}
                        />
                      </div>
                    )}
                  </div>
                  {isEditing && <p className="text-xs text-gray-500 text-center max-w-24">Click to change photo</p>}
                </div>

                {/* Profile Info */}
                <div className="flex-1 w-full">
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
                          className="touch-target"
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
                          className="touch-target"
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
                            className="touch-target"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Website</label>
                          <Input
                            value={editForm.website}
                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                            placeholder="https://yourwebsite.com"
                            disabled={saving}
                            className="touch-target"
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
              <TabsTrigger value="posts" className="flex items-center space-x-2 touch-target">
                <FileText className="w-4 h-4" />
                <span>Posts ({stats.totalPosts})</span>
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center space-x-2 touch-target">
                <Heart className="w-4 h-4" />
                <span>Liked</span>
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="flex items-center space-x-2 touch-target">
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
                      <Card
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handlePostView(post.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            {post.cover_image_url && (
                              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={post.cover_image_url || "/placeholder.svg"}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
                              {post.excerpt && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                  {post.excerpt}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                  <span>❤️ {post.likes_count || 0}</span>
                                  <span>👁️ {post.views_count || 0}</span>
                                  <span>💬 {post.comments_count || 0}</span>
                                </div>
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 touch-target">
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
                      <Card
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handlePostView(post.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            {post.cover_image_url && (
                              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={post.cover_image_url || "/placeholder.svg"}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
                              {post.excerpt && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                  {post.excerpt}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                  <span>❤️ {post.likes_count || 0}</span>
                                  <span>👁️ {post.views_count || 0}</span>
                                  <span>💬 {post.comments_count || 0}</span>
                                </div>
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Liked Posts</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Posts you like will appear here</p>
                  <Button onClick={loadLikedPosts} variant="outline" className="touch-target bg-transparent">
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
                      <Card
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handlePostView(post.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            {post.cover_image_url && (
                              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={post.cover_image_url || "/placeholder.svg"}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
                              {post.excerpt && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                  {post.excerpt}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                  <span>❤️ {post.likes_count || 0}</span>
                                  <span>👁️ {post.views_count || 0}</span>
                                  <span>💬 {post.comments_count || 0}</span>
                                </div>
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Bookmarked Posts</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Posts you bookmark will appear here</p>
                  <Button onClick={loadBookmarkedPosts} variant="outline" className="touch-target bg-transparent">
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
