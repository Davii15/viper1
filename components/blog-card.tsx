"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share, Bookmark, Eye, Clock, TrendingUp, Loader2 } from "lucide-react"
import type { Post } from "@/lib/supabase"
import { PostLikesModal } from "./post-likes-modal"
import { ChatWithAuthorButton } from "./chat-with-author-button"

interface BlogCardProps {
  post: Post
  onLike: (postId: string, isLiked: boolean) => void
  onBookmark: (postId: string, isBookmarked: boolean) => void
  onView: (postId: string) => void
  layout?: "magazine" | "card" | "minimal"
  isLikeLoading?: boolean
  isBookmarkLoading?: boolean
}

export function BlogCard({
  post,
  onLike,
  onBookmark,
  onView,
  layout = "magazine",
  isLikeLoading = false,
  isBookmarkLoading = false,
}: BlogCardProps) {
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLikeLoading) return

    try {
      console.log(`${post.is_liked ? "Unliking" : "Liking"} post:`, post.id)
      await onLike(post.id, post.is_liked || false)
    } catch (error) {
      console.error("Error in handleLike:", error)
    }
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isBookmarkLoading) return

    try {
      console.log(`${post.is_bookmarked ? "Unbookmarking" : "Bookmarking"} post:`, post.id)
      await onBookmark(post.id, post.is_bookmarked || false)
    } catch (error) {
      console.error("Error in handleBookmark:", error)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const shareData = {
      title: post.title,
      text: post.excerpt || post.title,
      url: `${window.location.origin}/post/${post.id}`,
    }

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        console.log("✅ Post shared successfully")
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url)
        // You could show a toast notification here
        console.log("✅ Link copied to clipboard")
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("❌ Error sharing post:", error)
        // Fallback: try copying to clipboard
        try {
          await navigator.clipboard.writeText(shareData.url)
          console.log("✅ Link copied to clipboard as fallback")
        } catch (clipboardError) {
          console.error("❌ Failed to copy to clipboard:", clipboardError)
        }
      }
    }
  }

  const handleView = () => {
    console.log("📖 Viewing post:", post.id)
    onView(post.id)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "blog":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "microblog":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "image":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "video":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (layout === "minimal") {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="cursor-pointer"
        onClick={handleView}
      >
        <Card className="hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{post.user?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{post.user?.full_name}</span>
                  {post.user?.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
                </div>
                <h3 className="font-semibold line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">{post.title}</h3>
                {post.excerpt && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      disabled={isLikeLoading}
                      className={`flex items-center space-x-1 p-1 h-auto transition-colors ${
                        post.is_liked ? "text-red-500 hover:text-red-600" : "hover:text-red-500"
                      }`}
                    >
                      {isLikeLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Heart className={`w-4 h-4 ${post.is_liked ? "fill-current" : ""}`} />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowLikesModal(true)
                        }}
                        className="text-sm hover:underline"
                      >
                        {post.likes_count || 0}
                      </button>
                    </Button>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{post.comments_count || 0}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{post.views_count || 0}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChatWithAuthorButton
                      authorId={post.user?.id || ""}
                      authorName={post.user?.full_name || ""}
                      size="sm"
                      variant="ghost"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBookmark}
                      disabled={isBookmarkLoading}
                      className={`p-1 h-auto transition-colors ${
                        post.is_bookmarked ? "text-blue-500 hover:text-blue-600" : "hover:text-blue-500"
                      }`}
                    >
                      {isBookmarkLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Bookmark className={`w-3 h-3 ${post.is_bookmarked ? "fill-current" : ""}`} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="p-1 h-auto hover:text-green-500 transition-colors"
                    >
                      <Share className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <PostLikesModal
          postId={post.id}
          isOpen={showLikesModal}
          onClose={() => setShowLikesModal(false)}
          likesCount={post.likes_count || 0}
        />
      </motion.div>
    )
  }

  if (layout === "card") {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="cursor-pointer"
        onClick={handleView}
      >
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800">
          {post.cover_image_url && !imageError && (
            <div className="aspect-video bg-gray-200 overflow-hidden relative">
              <img
                src={post.cover_image_url || "/placeholder.svg"}
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

              {/* Post Type Badge */}
              <Badge className={`absolute top-3 left-3 ${getPostTypeColor(post.post_type)}`}>{post.post_type}</Badge>

              {/* Trending Badge */}
              {post.is_trending && (
                <Badge className="absolute top-3 right-3 bg-orange-500 text-white">🔥 Trending</Badge>
              )}
            </div>
          )}
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{post.user?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{post.user?.full_name}</span>
                  {post.user?.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">{post.title}</h3>
            {post.excerpt && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">{post.excerpt}</p>
            )}

            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.categories.slice(0, 3).map((cat: any) => (
                  <Badge key={cat.category?.id || cat.id} variant="secondary" className="text-xs">
                    {cat.category?.name || cat.name}
                  </Badge>
                ))}
                {post.categories.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{post.categories.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLikeLoading}
                  className={`flex items-center space-x-1 p-2 rounded-full transition-all ${
                    post.is_liked
                      ? "text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20"
                      : "hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  }`}
                >
                  {isLikeLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className={`w-4 h-4 ${post.is_liked ? "fill-current" : ""}`} />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowLikesModal(true)
                    }}
                    className="text-sm hover:underline font-medium"
                  >
                    {post.likes_count || 0}
                  </button>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{post.comments_count || 0}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center space-x-1 text-gray-500 hover:text-green-500"
                >
                  <Share className="w-4 h-4" />
                  <span className="text-sm">{post.shares_count || 0}</span>
                </Button>
                <ChatWithAuthorButton
                  authorId={post.user?.id || ""}
                  authorName={post.user?.full_name || ""}
                  size="sm"
                  variant="ghost"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{post.views_count || 0}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  disabled={isBookmarkLoading}
                  className={`p-2 rounded-full transition-all ${
                    post.is_bookmarked
                      ? "text-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20"
                      : "hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                >
                  {isBookmarkLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bookmark className={`w-4 h-4 ${post.is_bookmarked ? "fill-current" : ""}`} />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <PostLikesModal
          postId={post.id}
          isOpen={showLikesModal}
          onClose={() => setShowLikesModal(false)}
          likesCount={post.likes_count || 0}
        />
      </motion.div>
    )
  }

  // Magazine layout (default)
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="cursor-pointer"
      onClick={handleView}
    >
      <Card className="hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{post.user?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{post.user?.full_name}</span>
                  {post.user?.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  {post.is_trending && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-600">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>@{post.user?.username}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(post.created_at)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">{post.title}</h3>
              {post.excerpt && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
              )}

              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories.slice(0, 3).map((cat: any) => (
                    <Badge key={cat.category?.id || cat.id} variant="secondary" className="text-xs">
                      {cat.category?.name || cat.name}
                    </Badge>
                  ))}
                  {post.categories.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{post.categories.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={isLikeLoading}
                    className={`flex items-center space-x-1 p-2 rounded-full transition-all ${
                      post.is_liked
                        ? "text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20"
                        : "hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    }`}
                  >
                    {isLikeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart className={`w-4 h-4 ${post.is_liked ? "fill-current" : ""}`} />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowLikesModal(true)
                      }}
                      className="text-sm hover:underline font-medium"
                    >
                      {post.likes_count || 0}
                    </button>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{post.comments_count || 0}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center space-x-1 text-gray-500 hover:text-green-500"
                  >
                    <Share className="w-4 h-4" />
                    <span className="text-sm">{post.shares_count || 0}</span>
                  </Button>
                  <ChatWithAuthorButton
                    authorId={post.user?.id || ""}
                    authorName={post.user?.full_name || ""}
                    size="sm"
                    variant="ghost"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Eye className="w-3 h-3" />
                    <span>{post.views_count || 0}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBookmark}
                    disabled={isBookmarkLoading}
                    className={`p-2 rounded-full transition-all ${
                      post.is_bookmarked
                        ? "text-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20"
                        : "hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    {isBookmarkLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bookmark className={`w-4 h-4 ${post.is_bookmarked ? "fill-current" : ""}`} />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {post.cover_image_url && !imageError && (
              <div className="md:col-span-1">
                <div className="relative">
                  <img
                    src={post.cover_image_url || "/placeholder.svg"}
                    alt="Post cover"
                    className="w-full h-32 md:h-full object-cover rounded-lg"
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <PostLikesModal
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        likesCount={post.likes_count || 0}
      />
    </motion.div>
  )
}
