"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share, Bookmark, Eye, TrendingUp, Sparkles } from "lucide-react"

// Sample post data to showcase the unique designs
const samplePost = {
  id: "1",
  title: "The Ubuntu Philosophy: How African Wisdom Shapes Modern Leadership",
  excerpt:
    "Exploring the ancient African philosophy of Ubuntu and its profound impact on contemporary leadership styles across the continent and beyond...",
  cover_image_url: "/placeholder.svg?height=400&width=600",
  user: {
    full_name: "Amara Okafor",
    username: "amaraokafor",
    avatar_url: "/placeholder.svg?height=48&width=48",
    verified: true,
    country: "Nigeria",
  },
  categories: [
    { category: { id: "1", name: "Leadership", icon: "👑", color: "bg-purple-500" } },
    { category: { id: "2", name: "Philosophy", icon: "🧠", color: "bg-blue-500" } },
  ],
  likes_count: 1247,
  comments_count: 89,
  shares_count: 156,
  views_count: 8934,
  is_trending: true,
  is_liked: false,
  is_bookmarked: false,
  created_at: new Date().toISOString(),
}

export function BlogCardShowcase() {
  const [currentLayout, setCurrentLayout] = useState<"magazine" | "card" | "minimal">("magazine")

  return (
    <div className="space-y-8">
      {/* Layout Selector */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Unique African-Inspired Layouts
        </h2>
        <p className="text-gray-600 mb-6">Completely different from Facebook - designed for storytelling</p>
        <div className="flex justify-center space-x-4">
          {["magazine", "card", "minimal"].map((layout) => (
            <Button
              key={layout}
              variant={currentLayout === layout ? "default" : "outline"}
              onClick={() => setCurrentLayout(layout as any)}
              className="capitalize"
            >
              {layout} Layout
            </Button>
          ))}
        </div>
      </div>

      {/* Magazine Layout - Premium Blog Style */}
      {currentLayout === "magazine" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
            {/* Hero Image with Overlay */}
            <div className="relative h-80 overflow-hidden">
              <img
                src={samplePost.cover_image_url || "/placeholder.svg"}
                alt={samplePost.title}
                className="w-full h-full object-cover"
              />

              {/* African Pattern Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 text-4xl">🌍</div>
                <div className="absolute top-4 right-4 text-4xl">🦁</div>
                <div className="absolute bottom-4 left-4 text-4xl">🌴</div>
                <div className="absolute bottom-4 right-4 text-4xl">👑</div>
              </div>

              {/* Trending Badge */}
              <div className="absolute top-6 left-6">
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending in Leadership
                </Badge>
              </div>

              {/* Author & Title Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="w-12 h-12 border-3 border-white shadow-lg">
                    <AvatarImage src={samplePost.user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                      AO
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-bold">{samplePost.user.full_name}</p>
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm">
                      @{samplePost.user.username} • {samplePost.user.country}
                    </p>
                  </div>
                </div>

                <h1 className="text-white font-bold text-3xl leading-tight mb-2 drop-shadow-lg">{samplePost.title}</h1>
              </div>
            </div>

            {/* Content Section */}
            <CardContent className="p-8">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">{samplePost.excerpt}</p>

              {/* Categories with African Styling */}
              <div className="flex flex-wrap gap-3 mb-6">
                {samplePost.categories.map((cat) => (
                  <Badge
                    key={cat.category.id}
                    className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-0 px-4 py-2 text-sm font-medium"
                  >
                    <span className="mr-2 text-lg">{cat.category.icon}</span>
                    {cat.category.name}
                  </Badge>
                ))}
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center justify-between pt-6 border-t border-orange-100">
                <div className="flex items-center space-x-6">
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-red-50 hover:text-red-600">
                    <Heart className="w-5 h-5" />
                    <span className="font-semibold">{samplePost.likes_count.toLocaleString()}</span>
                  </Button>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-600">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">{samplePost.comments_count}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 hover:bg-green-50 hover:text-green-600"
                  >
                    <Share className="w-5 h-5" />
                    <span className="font-semibold">{samplePost.shares_count}</span>
                  </Button>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{samplePost.views_count.toLocaleString()}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Card Layout - Pinterest Style */}
      {currentLayout === "card" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={samplePost.user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                      AO
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm">{samplePost.user.full_name}</h3>
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">@{samplePost.user.username} • 2h ago</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Hot
                </Badge>
              </div>

              {/* Title */}
              <h2 className="font-bold text-lg mb-3 line-clamp-2 hover:text-orange-600 transition-colors">
                {samplePost.title}
              </h2>

              {/* Cover Image */}
              <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                <img
                  src={samplePost.cover_image_url || "/placeholder.svg"}
                  alt={samplePost.title}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Excerpt */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{samplePost.excerpt}</p>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {samplePost.categories.map((cat) => (
                  <Badge key={cat.category.id} variant="outline" className="text-xs">
                    <span className="mr-1">{cat.category.icon}</span>
                    {cat.category.name}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{samplePost.likes_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{samplePost.comments_count}</span>
                  </Button>
                </div>
                <Button variant="ghost" size="sm">
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Minimal Layout - Clean Reading */}
      {currentLayout === "minimal" && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-3xl mx-auto py-8 border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex space-x-4">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={samplePost.user.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white">AO</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center space-x-2 mb-3">
                <span className="font-bold">{samplePost.user.full_name}</span>
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-500 text-sm">@{samplePost.user.username}</span>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-500 text-sm">2 hours ago</span>
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs">
                  Trending
                </Badge>
              </div>

              {/* Title */}
              <h2 className="font-bold text-2xl mb-3 line-clamp-2 hover:text-orange-600 transition-colors">
                {samplePost.title}
              </h2>

              {/* Excerpt */}
              <p className="text-gray-700 mb-4 line-clamp-3 leading-relaxed">{samplePost.excerpt}</p>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {samplePost.categories.map((cat) => (
                  <Badge key={cat.category.id} variant="secondary" className="text-xs">
                    {cat.category.icon} {cat.category.name}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                    <Heart className="w-4 h-4" />
                    <span>{samplePost.likes_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    <span>{samplePost.comments_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-500">
                    <Share className="w-4 h-4" />
                    <span>{samplePost.shares_count}</span>
                  </Button>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {samplePost.views_count}
                  </span>
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
