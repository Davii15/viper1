"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ImageIcon, Video, Eye, Save, Send, X, CheckCircle, Upload, LinkIcon, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/components/auth-provider"
import { createPost, getCategories } from "@/lib/posts"
import { RichTextEditor } from "@/components/rich-text-editor"
import { MediaUpload } from "@/components/media-upload"
import { Loader2 } from "lucide-react"

export default function CreatePost() {
  const { user, loading: authLoading } = useRequireAuth()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [coverImageType, setCoverImageType] = useState<"upload" | "url">("upload")
  const [postType, setPostType] = useState("blog")
  const [isPreview, setIsPreview] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadError, setUploadError] = useState("")

  // ✅ Media uploads state
  const [uploadedMedia, setUploadedMedia] = useState<
    Array<{
      url: string
      type: "image" | "video" | "file"
      name: string
    }>
  >([])

  useEffect(() => {
    if (user) {
      loadCategories()
    }
  }, [user])

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  // ✅ Handle media upload success
  const handleMediaUploadSuccess = (url: string, type: "image" | "video" | "file") => {
    console.log("✅ Media uploaded successfully:", url, type)

    // ✅ Add to uploaded media list
    const fileName = url.split("/").pop() || "uploaded-file"
    setUploadedMedia((prev) => [...prev, { url, type, name: fileName }])

    // ✅ If it's an image and no cover image is set, use it as cover
    if (type === "image" && !coverImage) {
      setCoverImage(url)
    }

    setUploadError("")
    setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`)

    // ✅ Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000)
  }

  // ✅ Handle media upload error
  const handleMediaUploadError = (error: string) => {
    console.error("❌ Media upload error:", error)
    setUploadError(error)
    setSuccess("")
  }

  // ✅ Remove uploaded media
  const removeUploadedMedia = (urlToRemove: string) => {
    setUploadedMedia((prev) => prev.filter((media) => media.url !== urlToRemove))

    // ✅ If removing cover image, clear it
    if (coverImage === urlToRemove) {
      setCoverImage("")
    }
  }

  // ✅ Insert media into content
  const insertMediaIntoContent = (media: { url: string; type: string; name: string }) => {
    let mediaHtml = ""

    if (media.type === "image") {
      mediaHtml = `<img src="${media.url}" alt="${media.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />`
    } else if (media.type === "video") {
      mediaHtml = `<video controls style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;">
        <source src="${media.url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>`
    } else {
      mediaHtml = `<a href="${media.url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">📎 ${media.name}</a>`
    }

    setContent((prev) => prev + mediaHtml)
  }

  const handleCoverImageSelect = (url: string) => {
    setCoverImage(url)
    console.log("Cover image selected:", url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsPublishing(true)

    if (!user) {
      setError("You must be logged in to create a post.")
      setIsPublishing(false)
      return
    }

    if (!title.trim() || !content.trim()) {
      setError("Title and content cannot be empty.")
      setIsPublishing(false)
      return
    }

    try {
      const newPost = {
        title,
        content,
        cover_image_url: coverImage || null, // Include cover image URL
        user_id: user.id,
      }
      await createPost(newPost) // Assuming createPost handles the data correctly
      router.push("/dashboard") // Redirect to dashboard after successful post
    } catch (err) {
      console.error("Failed to create post:", err)
      setError("Failed to create post. Please try again.")
    } finally {
      setIsPublishing(false)
    }
  }

  // ✅ Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="ml-2 text-gray-600">Loading user data...</p>
      </div>
    )
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
            <Button variant="outline" size="sm" onClick={() => {}}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 hover:from-orange-600 hover:via-red-600 hover:to-purple-700 shadow-lg"
              onClick={handleSubmit}
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

        {uploadError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{uploadError}</AlertDescription>
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

            {/* ✅ Enhanced Media Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Media Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MediaUpload
                  onMediaSelect={handleMediaUploadSuccess}
                  onCoverImageSelect={handleCoverImageSelect} // Added for consistency, though not directly used here
                  initialCoverImageUrl={coverImage} // Added for consistency
                />

                {/* ✅ Uploaded Media Gallery */}
                {uploadedMedia.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Uploaded Media ({uploadedMedia.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedMedia.map((media, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            {media.type === "image" ? (
                              <img
                                src={media.url || "/placeholder.svg"}
                                alt={media.name}
                                className="w-full h-full object-cover"
                              />
                            ) : media.type === "video" ? (
                              <video src={media.url} className="w-full h-full object-cover" muted />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                                    📎
                                  </div>
                                  <p className="text-xs text-gray-600 truncate">{media.name}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ✅ Media Actions */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => insertMediaIntoContent(media)}
                              className="text-xs"
                            >
                              Insert
                            </Button>
                            {media.type === "image" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setCoverImage(media.url)}
                                className="text-xs"
                              >
                                Cover
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeUploadedMedia(media.url)}
                              className="text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ✅ Cover Image Section with Upload/URL Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Cover Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={coverImageType} onValueChange={(value: any) => setCoverImageType(value)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload Image</TabsTrigger>
                    <TabsTrigger value="url">Image URL</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-4">
                    <MediaUpload
                      isCoverImage
                      onCoverImageSelect={handleCoverImageSelect}
                      initialCoverImageUrl={coverImage}
                    />
                    {coverImage && (
                      <p className="text-sm text-gray-500 mt-2">
                        Current Cover:{" "}
                        <a href={coverImage} target="_blank" rel="noopener noreferrer" className="underline truncate">
                          {coverImage}
                        </a>
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <LinkIcon className="w-5 h-5 text-gray-400 mt-2.5" />
                        <Input
                          placeholder="https://example.com/image.jpg"
                          value={coverImage}
                          onChange={(e) => setCoverImage(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* ✅ Cover Image Preview */}
                {coverImage && (
                  <div className="mt-4">
                    <div className="relative">
                      <img
                        src={coverImage || "/placeholder.svg"}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg"
                        onError={() => setCoverImage("")}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => setCoverImage("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
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
                <RichTextEditor value={content} onChange={setContent} />
                <div className="mt-2">
                  <MediaUpload onMediaSelect={insertMediaIntoContent} />
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
        
        .rich-content video {
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
