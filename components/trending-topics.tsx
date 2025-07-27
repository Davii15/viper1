"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Loader2, Hash } from "lucide-react"
import { getTrendingTopics, type TrendingTopic } from "@/lib/trending"
import Link from "next/link"

export function TrendingTopics() {
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrendingTopics()
  }, [])

  const loadTrendingTopics = async () => {
    try {
      setLoading(true)
      const trendingTopics = await getTrendingTopics(5)
      setTopics(trendingTopics)
    } catch (error) {
      console.error("Error loading trending topics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Trending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topics.map((topic, index) => (
            <Link key={topic.id} href={`/explore?topic=${encodeURIComponent(topic.name)}`}>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm hover:bg-orange-50 dark:hover:bg-gray-800"
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs mr-3">
                  {index + 1}
                </span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{topic.name}</div>
                  <div className="text-xs text-gray-500">
                    {topic.post_count} posts • {topic.growth_rate > 0 ? "+" : ""}
                    {topic.growth_rate}% growth
                  </div>
                </div>
                <div className="text-xs text-green-600 font-medium">{topic.engagement_score}</div>
              </Button>
            </Link>
          ))}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No trending topics yet</p>
          </div>
        )}

        <div className="mt-4 pt-2 border-t">
          <Link href="/explore">
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              View All Topics
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
