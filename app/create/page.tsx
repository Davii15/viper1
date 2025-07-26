"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, ImageIcon, Video, Hash, Eye, Save, Send, X, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createPost, getCategories } from "@/lib/posts"
import { RichTextEditor } from "@/components/rich-text-editor"
import type { User } from "@/lib/supabase"

export default function CreatePost() {
  const [user, setUser] = useState<User | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [postType, setPostType] = useState("blog")
  const [isPreview, setIsPreview] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.replace("/auth/signin")
        return
      }
      setUser(currentUser)

      // Load categories
      const categoriesData = await getCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load page data")
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required")
      return
    }

    setIsPublishing(true)
    setError("")

    try {
      // Convert HTML content to plain text for excerpt
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = content
      const plainTextContent = tempDiv.textContent || tempDiv.innerText || ""

      const postData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: plainTextContent.substring(0, 200) + (plainTextContent.length > 200 ? "..." : ""),
        cover_image_url: coverImage || undefined,
        post_type: postType,
        categories: tags,
      }

      const newPost = await createPost(postData)
      setSuccess("Post published successfully! 🎉")

      // Clear form
      setTitle("")
      setContent("")
      setTags([])
      setCoverImage("")
      setPostType("blog")

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error: any) {
      console.error("Error publishing post:", error)
      setError(error.message || "Failed to publish post. Please try again.")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSaveDraft = async () => {
    // TODO: Implement draft saving
    setSuccess("Draft saved! (Feature coming soon)")
  }

  // Convert HTML content to plain text for preview
  const getPlainTextContent = (htmlContent: string) => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = htmlContent
    return tempDiv.textContent || tempDiv.innerText || ""
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading editor...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* African Pattern Background */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-2xl animate-pulse">🌍</div>
        <div className="absolute top-20 right-20 text-xl animate-bounce">✍️</div>
        <div className="absolute bottom-20 left-20 text-2xl animate-pulse">📝</div>
        <div className="absolute bottom-10 right-10 text-xl animate-bounce">✨</div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Create New Post</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsPreview(!isPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {isPreview ? "Edit" : "Preview"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 hover:from-orange-600 hover:via-red-600 hover:to-purple-700 shadow-lg"
              onClick={handlePublish}
              disabled={isPublishing || !title.trim() || !content.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {isPublishing ? "Publishing..." : "Chapisha - Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
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

        {!isPreview ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Post Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Post Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant={postType === "blog" ? "default" : "outline"}
                    className="h-20 flex-col"
                    onClick={() => setPostType("blog")}
                  >
                    <div className="w-8 h-8 mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600">📝</span>
                    </div>
                    Blog Post
                  </Button>
                  <Button
                    variant={postType === "microblog" ? "default" : "outline"}
                    className="h-20 flex-col"
                    onClick={() => setPostType("microblog")}
                  >
                    <div className="w-8 h-8 mb-2 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600">💬</span>
                    </div>
                    Microblog
                  </Button>
                  <Button
                    variant={postType === "image" ? "default" : "outline"}
                    className="h-20 flex-col"
                    onClick={() => setPostType("image")}
                  >
                    <div className="w-8 h-8 mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    Image Post
                  </Button>
                  <Button
                    variant={postType === "video" ? "default" : "outline"}
                    className="h-20 flex-col"
                    onClick={() => setPostType("video")}
                  >
                    <div className="w-8 h-8 mb-2 bg-red-100 rounded-full flex items-center justify-center">
                      <Video className="w-4 h-4 text-red-600" />
                    </div>
                    Video Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Title */}
            <Card>
              <CardContent className="pt-6">
                <Input
                  placeholder="Enter your post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold border-0 px-0 focus-visible:ring-0 placeholder:text-gray-400"
                />
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Cover Image URL (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                />
                {coverImage && (
                  <div className="mt-4">
                    <img
                      src={coverImage || "/placeholder.svg"}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={() => setCoverImage("")}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rich Text Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Tell your story... Use the toolbar above to format your text with different fonts, colors, and styles!"
                  minHeight="500px"
                />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Hash className="w-5 h-5 mr-2" />
                  Categories & Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Add a category or tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={tags.length >= 5}
                  />
                  <Button onClick={addTag} variant="outline" disabled={tags.length >= 5}>
                    Add
                  </Button>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Available categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {categories
                      .filter((cat) => !tags.includes(cat.name))
                      .slice(0, 8)
                      .map((category) => (
                        <Button
                          key={category.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => tags.length < 5 && setTags([...tags, category.name])}
                          className="text-xs flex items-center space-x-1"
                          disabled={tags.length >= 5}
                        >
                          <span>{category.icon}</span>
                          <span>+ {category.name}</span>
                        </Button>
                      ))}
                  </div>
                  {tags.length >= 5 && <p className="text-xs text-gray-500 mt-2">Maximum 5 categories allowed</p>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Preview Mode */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-8">
                {/* Author Info */}
                <div className="flex items-center space-x-3 mb-6">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{user.full_name}</div>
                    <div className="text-sm text-gray-500">@{user.username} • Just now</div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold mb-4">{title || "Your Post Title"}</h1>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Cover Image */}
                {coverImage && (
                  <div className="w-full h-64 mb-6 overflow-hidden rounded-lg">
                    <img src={coverImage || "/placeholder.svg"} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-lg max-w-none">
                  {content ? (
                    <div className="rich-content" dangerouslySetInnerHTML={{ __html: content }} />
                  ) : (
                    <p className="text-gray-500 italic">Your content will appear here...</p>
                  )}
                </div>

                {/* Engagement Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                      <span>❤️</span>
                      <span>0</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                      <span>💬</span>
                      <span>0</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                      <span>🔗</span>
                      <span>0</span>
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm">
                    <span>🔖</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Custom styles for rich content preview */}
      <style jsx global>{`
        .rich-content {
          line-height: 1.7;
        }
        
        .rich-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .rich-content pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.375rem;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
        }
        
        .rich-content ul, .rich-content ol {
          padding-left: 2rem;
          margin: 0.5rem 0;
        }
        
        .rich-content li {
          margin: 0.25rem 0;
        }
        
        .rich-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .rich-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
        }
        
        .rich-content h1, .rich-content h2, .rich-content h3 {
          margin: 1.5rem 0 1rem 0;
          font-weight: bold;
        }
        
        .rich-content h1 { font-size: 2rem; }
        .rich-content h2 { font-size: 1.5rem; }
        .rich-content h3 { font-size: 1.25rem; }
        
        .rich-content p {
          margin: 1rem 0;
        }
      `}</style>
    </div>
  )
}
