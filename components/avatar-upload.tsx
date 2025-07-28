"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, X, Loader2 } from "lucide-react"
import { uploadFile, validateFile, resizeImage } from "@/lib/upload"

interface AvatarUploadProps {
  currentAvatarUrl?: string
  userName: string
  onUploadSuccess: (url: string) => void
  onUploadError: (error: string) => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
}

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  onUploadSuccess,
  onUploadError,
  disabled = false,
  size = "lg",
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  }

  const handleFileSelect = async (file: File) => {
    try {
      setUploading(true)
      onUploadError("") // Clear previous errors

      console.log("📁 File selected:", file.name, file.size, file.type)

      // ✅ Validate file
      const validationError = validateFile(file)
      if (validationError) {
        onUploadError(validationError)
        return
      }

      // ✅ Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreviewUrl(previewUrl)

      // ✅ Resize image for better performance
      console.log("🔄 Resizing image...")
      const resizedFile = await resizeImage(file, 400, 0.9)
      console.log("✅ Image resized:", resizedFile.size, "bytes")

      // ✅ Upload to Supabase Storage
      console.log("📤 Uploading to Supabase Storage...")
      const result = await uploadFile(resizedFile, "avatars", "profile-photos")

      console.log("✅ Upload successful:", result.url)
      onUploadSuccess(result.url)

      // ✅ Clean up preview
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    } catch (error: any) {
      console.error("❌ Upload failed:", error)
      onUploadError(error.message || "Failed to upload image")

      // Clean up preview on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Avatar with upload overlay */}
      <div
        className={`relative ${sizeClasses[size]} group cursor-pointer`}
        onClick={!disabled && !uploading ? openFileDialog : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Avatar className={`${sizeClasses[size]} transition-all duration-200 ${dragOver ? "scale-105" : ""}`}>
          <AvatarImage src={previewUrl || currentAvatarUrl || "/placeholder.svg"} />
          <AvatarFallback className="text-lg">{userName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        {!disabled && (
          <div
            className={`absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              dragOver ? "opacity-100" : ""
            }`}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        )}

        {/* Upload button */}
        {!disabled && (
          <Button
            size="sm"
            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700 border-2 border-white"
            onClick={(e) => {
              e.stopPropagation()
              openFileDialog()
            }}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </Button>
        )}

        {/* Clear preview button */}
        {previewUrl && !uploading && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              clearPreview()
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Upload instructions */}
      {!disabled && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            Click or drag to upload
            <br />
            Max 5MB • JPG, PNG, WebP
          </p>
        </div>
      )}
    </div>
  )
}
