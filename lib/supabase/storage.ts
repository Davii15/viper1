import { supabaseBrowser } from "./client" // Corrected import
import { v4 as uuidv4 } from "uuid"

export async function uploadFileToSupabase(
  file: File,
  bucketName: string,
  folder: string,
  onProgress?: (progress: number) => void,
): Promise<string | null> {
  const fileExtension = file.name.split(".").pop()
  const fileName = `${folder}/${uuidv4()}.${fileExtension}`

  const { data, error } = await supabaseBrowser.storage.from(bucketName).upload(fileName, file, {
    // Using supabaseBrowser
    cacheControl: "3600",
    upsert: false,
    // You can add a transform option here if you want to resize/optimize images on upload
    // transform: {
    //   width: 500,
    //   height: 500,
    //   resize: 'contain',
    // },
  })

  if (error) {
    console.error("Error uploading file:", error)
    throw error
  }

  // Get public URL
  const { data: publicUrlData } = supabaseBrowser.storage.from(bucketName).getPublicUrl(fileName) // Using supabaseBrowser

  return publicUrlData.publicUrl
}

export async function deleteFileFromSupabase(url: string, bucketName: string): Promise<boolean> {
  const pathSegments = url.split("/")
  const fileNameWithFolder = pathSegments.slice(pathSegments.indexOf(bucketName) + 1).join("/")

  const { data, error } = await supabaseBrowser.storage.from(bucketName).remove([fileNameWithFolder]) // Using supabaseBrowser

  if (error) {
    console.error("Error deleting file:", error)
    return false
  }
  return true
}
