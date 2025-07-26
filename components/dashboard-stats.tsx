"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, FileText, Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DashboardStatsProps {
  userId: string
}

interface Stats {
  totalPosts: number
  totalLikes: number
  totalViews: number
  followers: number
}

export function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    totalLikes: 0,
    totalViews: 0,
    followers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [userId])

  const loadStats = async () => {
    try {
      const supabase = createClient()

      // Get user's posts count and total likes/views
      const { data: postsData } = await supabase
        .from("posts")
        .select("likes_count, views_count")
        .eq("user_id", userId)
        .eq("status", "published")

      // Get followers count
      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId)

      const totalPosts = postsData?.length || 0
      const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0
      const totalViews = postsData?.reduce((sum, post) => sum + (post.views_count || 0), 0) || 0

      setStats({
        totalPosts,
        totalLikes,
        totalViews,
        followers: followersCount || 0,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statItems = [
    {
      label: "Posts",
      value: stats.totalPosts,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Likes",
      value: stats.totalLikes,
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Total Views",
      value: stats.totalViews,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Followers",
      value: stats.followers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{item.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
