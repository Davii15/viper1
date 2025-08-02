"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Eye, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/components/auth-provider"
import { RichTextEditor } from "@/components/rich-text-editor"
import { MediaUpload } from "@/components/media-upload"
import { createPost, getCategories } from "@/lib/posts"
import type { Category } from "@/lib/supabase"

export default function CreatePost() {
  // ✅ Use centralized auth system
  const { user, loading: authLoading } = useRequireAuth()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [postType, setPostType] = useState("blog")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPreview, setIsPreview] = useState(false)

  // ✅ Load categories when component mounts
  useEffect(() => {
    if (user && !authLoading) {
      loadCategories()
    }
  }, [user, authLoading])

  const loadCategories = async () => {
    try {
      console.log("🏷️ Loading categories for post creation...")
      const categoriesData = await getCategories()
      setCategories(categoriesData)
      console.log(`✅ Loaded ${categoriesData.length} categories`)
    } catch (error) {
      console.error("❌ Error loading categories:", error)
      // Set default categories as fallback
      const defaultCategories = [
        { id: "1", name: "Technology", icon: "💻", color: "#3B82F6", description: "Tech news and tutorials" },
        { id: "2", name: "Lifestyle", icon: "🌟", color: "#F59E0B", description: "Life tips and experiences" },
        { id: "3", name: "Travel", icon: "✈️", color: "#10B981", description: "Travel stories and guides" },
        { id: "4", name: "Food", icon: "🍽️", color: "#EF4444", description: "Recipes and food culture" },
        { id: "5", name: "Business", icon: "💼", color: "#8B5CF6", description: "Business insights and tips" },
      ]
      setCategories(defaultCategories as Category[])
    }
  }

  const handleMediaSelect = (url: string, type: "image" | "video") => {
    // Insert media into the rich text editor
    const mediaHtml =
      type === "image"
        ? `<img src="${url}" alt="Uploaded image" style="max-width: 100%; height: auto; margin: 1rem 0;" />`
        : `<video src="${url}" controls style="max-width: 100%; height: auto; margin: 1rem 0;"></video>`

    setContent((prev) => prev + mediaHtml)
  }

  const handleCoverImageSelect = (url: string) => {
    setCoverImageUrl(url)
  }

  const validateForm = () => {
    if (!title.trim()) {
      setError("Please enter a title for your post")
      return false
    }

    if (!content.trim()) {
      setError("Please add some content to your post")
      return false
    }

    if (title.length > 200) {
      setError("Title must be less than 200 characters")
      return false
    }

    return true
  }

  const handleSave = async (isDraft = false) => {
    if (!user) return

    if (!validateForm()) return

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      console.log("💾 Saving post...")

      // Generate excerpt if not provided
      const finalExcerpt =
        excerpt.trim() ||
        content.replace(/<[^>]*>/g, "").substring(0, 200) + (content.replace(/<[^>]*>/g, "").length > 200 ? "..." : "")

      const postData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: finalExcerpt,
        cover_image_url: coverImageUrl || null,
        post_type: postType,
        categories: selectedCategories,
      }

      const createdPost = await createPost(postData)

      console.log("✅ Post created successfully:", createdPost.id)
      setSuccess("Post created successfully! 🎉")

      // Redirect to the post after a short delay
      setTimeout(() => {
        router.push(`/post/${createdPost.id}`)
      }, 2000)
    } catch (error: any) {
      console.error("❌ Error creating post:", error)
      setError(error.message || "Failed to create post. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  // ✅ Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading editor...</p>
        </motion.div>
      </div>
    )
  }

  // ✅ useRequireAuth will handle redirect if no user
  if (!user) {
    return null
  }

  // ✅ Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Card className="p-8 max-w-md">
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Post Created! 🎉</h2>
              <p className="text-gray-600">{success}</p>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm font-medium">🌍 Your story is now live!</p>
                <p className="text-green-600 text-xs mt-1">
                  Your post is now accessible to the global Ubuntu community
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm">Redirecting to your post...</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* African Pattern Background */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-2xl animate-pulse">✍️</div>
        <div className="absolute top-20 right-20 text-xl animate-bounce">📝</div>
        <div className="absolute bottom-20 left-20 text-2xl animate-pulse">🌍</div>
        <div className="absolute bottom-10 right-10 text-xl animate-bounce">✨</div>
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
            <h1 className="text-xl font-semibold">Create Post</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
              className="touch-target bg-transparent"
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreview ? "Edit" : "Preview"}
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 touch-target"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success/Error Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {!isPreview ? (
              <>
                {/* Title */}
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Post Title *</Label>
                        <Input
                          id="title"
                          placeholder="Enter your post title..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="text-lg font-semibold touch-target"
                          maxLength={200}
                        />
                        <p className="text-xs text-gray-500 mt-1">{title.length}/200 characters</p>
                      </div>

                      <div>
                        <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                        <Input
                          id="excerpt"
                          placeholder="Brief description of your post..."
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                          className="touch-target"
                          maxLength={300}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {excerpt.length}/300 characters {!excerpt && "(Auto-generated if empty)"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cover Image */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cover Image/Video</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MediaUpload
                      onCoverImageSelect={handleCoverImageSelect}
                      isCoverImage={true}
                      initialCoverImageUrl={coverImageUrl}
                    />
                  </CardContent>
                </Card>

                {/* Content Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content *</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="Start writing your story..."
                      minHeight="500px"
                    />
                  </CardContent>
                </Card>

                {/* Media Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Media</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MediaUpload onMediaSelect={handleMediaSelect} />
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Preview Mode */
              <Card>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {coverImageUrl && (
                      <div className="w-full h-64 rounded-lg overflow-hidden">
                        {coverImageUrl.match(/\.(mp4|mov|avi|webm)$/i) ? (
                          <video src={coverImageUrl} className="w-full h-full object-cover" controls />
                        ) : (
                          <img
                            src={coverImageUrl || "/placeholder.svg"}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}

                    <div>
                      <h1 className="text-3xl font-bold mb-4">{title || "Untitled Post"}</h1>
                      {excerpt && <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 italic">{excerpt}</p>}
                      <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: content || "<p>No content yet...</p>" }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Post Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="post-type">Post Type</Label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger className="touch-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="microblog">Microblog</SelectItem>
                      <SelectItem value="image">Image Post</SelectItem>
                      <SelectItem value="video">Video Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 touch-target"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="rounded"
                      />
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">{selectedCategories.length} categories selected</p>
                )}
              </CardContent>
            </Card>

            {/* Publishing Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publishing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span>👤</span>
                    <span>Author: {user.full_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🌍</span>
                    <span>Visibility: Public</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📅</span>
                    <span>Publish: Immediately</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Writing Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Use a compelling title to grab attention</p>
                  <p>• Add a cover image to make your post stand out</p>
                  <p>• Break up text with headings and images</p>
                  <p>• Choose relevant categories for better discovery</p>
                  <p>• Preview your post before publishing</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
