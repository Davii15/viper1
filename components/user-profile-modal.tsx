"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Globe, Calendar, Heart } from "lucide-react"
import { FollowButton } from "./follow-button"
import { getUserFollowers, getUserFollowing, getUserPosts } from "@/lib/posts"
import { createClient } from "@/lib/supabase/client"
import type { User, Post } from "@/lib/supabase"

interface UserProfileModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const [user, setUser] = useState<User | null>(null)
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")

  useEffect(() => {
    if (isOpen && userId) {
      loadUserData()
    }
  }, [isOpen, userId])

  const loadUserData = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const supabase = createClient()

      // Load user profile
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

      if (userError) throw userError
      setUser(userData)

      // Load user stats
      const [followersData, followingData, postsData] = await Promise.all([
        getUserFollowers(userId),
        getUserFollowing(userId),
        getUserPosts(userId, 1, 10),
      ])

      setFollowers(followersData)
      setFollowing(followingData)
      setPosts(postsData.posts)
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-xl">{user.full_name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-xl font-bold">{user.full_name}</h2>
                {user.verified && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-2">@{user.username}</p>
              {user.bio && <p className="text-gray-700 mb-3">{user.bio}</p>}

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
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
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(user.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm">
                  <strong>{following.length}</strong> Following
                </span>
                <span className="text-sm">
                  <strong>{followers.length}</strong> Followers
                </span>
                <span className="text-sm">
                  <strong>{posts.length}</strong> Posts
                </span>
              </div>

              <FollowButton userId={user.id} username={user.username} onFollowChange={() => loadUserData()} />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="followers">Followers</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {posts.map((post) => (
                  <div key={post.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <h4 className="font-semibold line-clamp-1">{post.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{post.excerpt}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{post.likes_count}</span>
                      </span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && <p className="text-center text-gray-500 py-4">No posts yet</p>}
              </div>
            </TabsContent>

            <TabsContent value="followers" className="mt-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {followers.map((follow) => (
                  <div key={follow.follower.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={follow.follower.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{follow.follower.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-sm">{follow.follower.full_name}</span>
                          {follow.follower.verified && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">@{follow.follower.username}</span>
                      </div>
                    </div>
                    <FollowButton
                      userId={follow.follower.id}
                      username={follow.follower.username}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                ))}
                {followers.length === 0 && <p className="text-center text-gray-500 py-4">No followers yet</p>}
              </div>
            </TabsContent>

            <TabsContent value="following" className="mt-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {following.map((follow) => (
                  <div key={follow.following.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={follow.following.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{follow.following.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-sm">{follow.following.full_name}</span>
                          {follow.following.verified && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">@{follow.following.username}</span>
                      </div>
                    </div>
                    <FollowButton
                      userId={follow.following.id}
                      username={follow.following.username}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                ))}
                {following.length === 0 && <p className="text-center text-gray-500 py-4">Not following anyone yet</p>}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
