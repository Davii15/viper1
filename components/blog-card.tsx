"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share, Bookmark, Eye, Clock, TrendingUp } from "lucide-react"
import type { Post } from "@/lib/supabase"
import { PostLikesModal } from "./post-likes-modal"
import { ChatWithAuthorButton } from "./chat-with-author-button"

interface BlogCardProps {
  post: Post
  onLike: (postId: string, isLiked: boolean) => void
  onBookmark: (postId: string, isBookmarked: boolean) => void
  onView: (postId: string) => void
  layout?: "magazine" | "card" | "minimal"
}

export function BlogCard({ post, onLike, onBookmark, onView, layout = "magazine" }: BlogCardProps) {
  const [isLiking, setIsLiking] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [showLikesModal, setShowLikesModal] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLiking) return

    setIsLiking(true)
    try {
      await onLike(post.id, post.is_liked || false)
    } finally {
      setIsLiking(false)
    }
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isBookmarking) return

    setIsBookmarking(true)
    try {
      await onBookmark(post.id, post.is_bookmarked || false)
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleView = () => {
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

  if (layout === "minimal") {
    return (
      <motion.div whileHover={{ scale: 1.01 }} className="cursor-pointer" onClick={handleView}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{post.user?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm">{post.user?.full_name}</span>
                  {post.user?.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
                </div>
                <h3 className="font-semibold line-clamp-2 mb-2">{post.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      disabled={isLiking}
                      className="flex items-center space-x-1"
                    >
                      <Heart className={`w-4 h-4 ${post.is_liked ? "fill-red-500 text-red-500" : ""}`} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowLikesModal(true)
                        }}
                        className="text-sm hover:underline"
                      >
                        {post.likes_count}
                      </button>
                    </Button>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{post.comments_count}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{post.views_count}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChatWithAuthorButton
                      authorId={post.user?.id || ""}
                      authorName={post.user?.full_name || ""}
                      size="sm"
                      variant="ghost"
                    />
                    <Button variant="ghost" size="sm" onClick={handleBookmark} disabled={isBookmarking}>
                      <Bookmark className={`w-3 h-3 ${post.is_bookmarked ? "fill-current" : ""}`} />
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
          likesCount={post.likes_count}
        />
      </motion.div>
    )
  }

  if (layout === "card") {
    return (
      <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={handleView}>
        <Card className="hover:shadow-lg transition-shadow overflow-hidden">
          {post.cover_image_url && (
            <div className="aspect-video bg-gray-200 overflow-hidden">
              <img
                src={post.cover_image_url || "/placeholder.svg"}
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
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
                  <span className="font-semibold text-sm">{post.user?.full_name}</span>
                  {post.user?.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h3>
            {post.excerpt && <p className="text-gray-600 text-sm mb-3 line-clamp-3">{post.excerpt}</p>}

            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.categories.slice(0, 3).map((cat: any) => (
                  <Badge key={cat.category.id} variant="secondary" className="text-xs">
                    {cat.category.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking}
                  className="flex items-center space-x-1"
                >
                  <Heart className={`w-4 h-4 ${post.is_liked ? "fill-red-500 text-red-500" : ""}`} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowLikesModal(true)
                    }}
                    className="text-sm hover:underline"
                  >
                    {post.likes_count}
                  </button>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{post.comments_count}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <Share className="w-4 h-4" />
                  <span className="text-sm">{post.shares_count}</span>
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
                  <span>{post.views_count}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={handleBookmark} disabled={isBookmarking}>
                  <Bookmark className={`w-4 h-4 ${post.is_bookmarked ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <PostLikesModal
          postId={post.id}
          isOpen={showLikesModal}
          onClose={() => setShowLikesModal(false)}
          likesCount={post.likes_count}
        />
      </motion.div>
    )
  }

  // Magazine layout (default)
  return (
    <motion.div whileHover={{ scale: 1.01 }} className="cursor-pointer" onClick={handleView}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{post.user?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-sm">{post.user?.full_name}</span>
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
              <h3 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h3>
              {post.excerpt && <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>}

              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories.slice(0, 3).map((cat: any) => (
                    <Badge key={cat.category.id} variant="secondary" className="text-xs">
                      {cat.category.name}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={isLiking}
                    className="flex items-center space-x-1"
                  >
                    <Heart className={`w-4 h-4 ${post.is_liked ? "fill-red-500 text-red-500" : ""}`} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowLikesModal(true)
                      }}
                      className="text-sm hover:underline"
                    >
                      {post.likes_count}
                    </button>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{post.comments_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Share className="w-4 h-4" />
                    <span className="text-sm">{post.shares_count}</span>
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
                    <span>{post.views_count}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleBookmark} disabled={isBookmarking}>
                    <Bookmark className={`w-4 h-4 ${post.is_bookmarked ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>
            </div>

            {post.cover_image_url && (
              <div className="md:col-span-1">
                <img
                  src={post.cover_image_url || "/placeholder.svg"}
                  alt="Post cover"
                  className="w-full h-32 md:h-full object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <PostLikesModal
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        likesCount={post.likes_count}
      />
    </motion.div>
  )
}
