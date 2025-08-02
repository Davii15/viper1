import { createClient } from "./client"

const supabase = createClient()

export const uploadFileToSupabase = async (
  file: File,
  bucket: string,
  folder: string,
  onProgress?: (progress: number) => void,
): Promise<string | null> => {
  try {
    console.log("📤 Uploading file to Supabase:", file.name)

    // Create unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Simulate progress for better UX
    if (onProgress) {
      onProgress(10)
    }

    // Upload file
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("❌ Upload error:", uploadError)
      throw uploadError
    }

    if (onProgress) {
      onProgress(90)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath)

    if (onProgress) {
      onProgress(100)
    }

    console.log("✅ File uploaded successfully:", publicUrl)
    return publicUrl
  } catch (error) {
    console.error("❌ Error uploading file:", error)
    throw error
  }
}

export const deleteFileFromSupabase = async (fileUrl: string, bucket: string): Promise<void> => {
  try {
    console.log("🗑️ Deleting file from Supabase:", fileUrl)

    // Extract file path from URL
    const urlParts = fileUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]
    const folderName = urlParts[urlParts.length - 2]
    const filePath = `${folderName}/${fileName}`

    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) {
      console.error("❌ Delete error:", error)
      throw error
    }

    console.log("✅ File deleted successfully")
  } catch (error) {
    console.error("❌ Error deleting file:", error)
    throw error
  }
}

export const getFileUrl = (bucket: string, filePath: string): string => {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return publicUrl
}
