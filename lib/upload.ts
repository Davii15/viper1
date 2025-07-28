import { supabase } from "@/lib/supabase"

export interface UploadResult {
  url: string
  path: string
}

export interface UploadError {
  message: string
  code?: string
}

// ✅ Upload file to Supabase Storage
export const uploadFile = async (file: File, bucket: string, folder = "", userId?: string): Promise<UploadResult> => {
  try {
    // ✅ Validate file
    const validationError = validateFile(file)
    if (validationError) {
      throw new Error(validationError)
    }

    // ✅ Generate unique filename
    const fileExt = file.name.split(".").pop()
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}_${randomString}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    console.log("📤 Uploading file:", filePath)

    // ✅ Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("❌ Upload error:", error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // ✅ Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    console.log("✅ File uploaded successfully:", publicUrl)

    return {
      url: publicUrl,
      path: data.path,
    }
  } catch (error: any) {
    console.error("❌ Upload failed:", error)
    throw error
  }
}

// ✅ Validate file before upload
export const validateFile = (file: File): string | null => {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return "File size must be less than 5MB"
  }

  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return "Only JPEG, PNG, WebP, and GIF images are allowed"
  }

  return null
}

// ✅ Delete file from Supabase Storage
export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) {
      console.error("❌ Delete error:", error)
      throw new Error(`Delete failed: ${error.message}`)
    }
    console.log("✅ File deleted successfully:", path)
  } catch (error) {
    console.error("❌ Delete failed:", error)
    throw error
  }
}

// ✅ Resize image before upload (optional)
export const resizeImage = (file: File, maxWidth = 800, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      const newWidth = img.width * ratio
      const newHeight = img.height * ratio

      // Set canvas size
      canvas.width = newWidth
      canvas.height = newHeight

      // Draw and resize image
      ctx?.drawImage(img, 0, 0, newWidth, newHeight)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(resizedFile)
          } else {
            reject(new Error("Failed to resize image"))
          }
        },
        file.type,
        quality,
      )
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(file)
  })
}

// ✅ Generate avatar placeholder URL
export const getAvatarPlaceholder = (name: string, size = 200): string => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return `/placeholder.svg?height=${size}&width=${size}&text=${encodeURIComponent(initials)}`
}
