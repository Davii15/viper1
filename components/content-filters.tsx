"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Filter, X } from "lucide-react"
import { getCategories } from "@/lib/posts"

interface ContentFiltersProps {
  onFiltersChange: (filters: any) => void
}

export function ContentFilters({ onFiltersChange }: ContentFiltersProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    const filters: any = {}
    if (selectedCategory) filters.category = selectedCategory
    if (selectedType) filters.postType = selectedType
    onFiltersChange(filters)
  }, [selectedCategory, selectedType, onFiltersChange])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const clearFilters = () => {
    setSelectedCategory(null)
    setSelectedType(null)
  }

  const hasActiveFilters = selectedCategory || selectedType

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                {(selectedCategory ? 1 : 0) + (selectedType ? 1 : 0)}
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center space-x-1 text-gray-500"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center space-x-2">
            {selectedCategory && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>{selectedCategory}</span>
                <button onClick={() => setSelectedCategory(null)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedType && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>{selectedType}</span>
                <button onClick={() => setSelectedType(null)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Categories */}
              <div>
                <h4 className="font-medium mb-2">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                      className="flex items-center space-x-1"
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Post Types */}
              <div>
                <h4 className="font-medium mb-2">Post Type</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "blog", label: "Blog Posts", icon: "📝" },
                    { value: "microblog", label: "Microblogs", icon: "💬" },
                    { value: "image", label: "Image Posts", icon: "📸" },
                    { value: "video", label: "Video Posts", icon: "🎥" },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={selectedType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(selectedType === type.value ? null : type.value)}
                      className="flex items-center space-x-1"
                    >
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
