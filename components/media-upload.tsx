"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, Video, UploadCloud, X, LinkIcon, CheckCircle } from "lucide-react"
import { uploadFileToSupabase, deleteFileFromSupabase } from "@/lib/supabase/storage"
import { cn } from "@/lib/utils"

interface MediaUploadProps {
  onMediaSelect: (url: string, type: "image" | "video") => void
  onCoverImageSelect?: (url: string) => void
  isCoverImage?: boolean
  initialCoverImageUrl?: string
}

interface UploadedFile {
  id: string
  name: string
  url: string
  type: "image" | "video"
  progress: number
  status: "uploading" | "completed" | "failed"
}

export function MediaUpload({
  onMediaSelect,
  onCoverImageSelect,
  isCoverImage = false,
  initialCoverImageUrl,
}: MediaUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [urlInput, setUrlInput] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl || "")

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: file.name + Date.now(), // Simple unique ID
        name: file.name,
        url: URL.createObjectURL(file), // Temporary URL for preview
        type: file.type.startsWith("image/") ? "image" : "video",
        progress: 0,
        status: "uploading",
      }))
      setFiles((prev) => [...prev, ...newFiles])

      for (const file of acceptedFiles) {
        const tempFileId = file.name + Date.now() // Match the ID used above
        try {
          const publicUrl = await uploadFileToSupabase(
            file,
            "post_media", // Your Supabase bucket name
            "posts", // Folder inside the bucket
            (progress) => {
              setFiles((prev) => prev.map((f) => (f.id === tempFileId ? { ...f, progress: progress } : f)))
            },
          )

          if (publicUrl) {
            setFiles((prev) =>
              prev.map((f) => (f.id === tempFileId ? { ...f, url: publicUrl, status: "completed", progress: 100 } : f)),
            )
            if (isCoverImage) {
              setCoverImageUrl(publicUrl)
              onCoverImageSelect?.(publicUrl)
            } else {
              onMediaSelect(publicUrl, file.type.startsWith("image/") ? "image" : "video")
            }
          } else {
            throw new Error("Failed to get public URL")
          }
        } catch (error) {
          console.error("Upload failed for", file.name, error)
          setFiles((prev) => prev.map((f) => (f.id === tempFileId ? { ...f, status: "failed", progress: 0 } : f)))
        }
      }
    },
    [onMediaSelect, onCoverImageSelect, isCoverImage],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".gif", ".webp", ".svg"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    multiple: !isCoverImage, // Allow multiple files unless it's a cover image
  })

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      const type = urlInput.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i)
        ? "image"
        : urlInput.match(/\.(mp4|mov|avi|webm)$/i)
          ? "video"
          : null

      if (type) {
        if (isCoverImage) {
          setCoverImageUrl(urlInput.trim())
          onCoverImageSelect?.(urlInput.trim())
        } else {
          onMediaSelect(urlInput.trim(), type as "image" | "video")
        }
        setUrlInput("")
        setIsDialogOpen(false)
      } else {
        alert("Invalid URL or unsupported media type. Please provide a direct link to an image or video file.")
      }
    }
  }

  const handleRemoveFile = async (fileToRemove: UploadedFile) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileToRemove.id))
    if (fileToRemove.status === "completed") {
      try {
        await deleteFileFromSupabase(fileToRemove.url, "post_media")
        console.log("File deleted from Supabase:", fileToRemove.url)
      } catch (error) {
        console.error("Failed to delete file from Supabase:", error)
        alert("Failed to delete file from storage. Please try again.")
      }
    }
  }

  const handleSelectExistingFile = (file: UploadedFile) => {
    if (isCoverImage) {
      setCoverImageUrl(file.url)
      onCoverImageSelect?.(file.url)
    } else {
      onMediaSelect(file.url, file.type)
    }
    setIsDialogOpen(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {isCoverImage ? (
          <div className="relative w-full h-48 border-2 border-dashed rounded-lg cursor-pointer flex items-center justify-center overflow-hidden group hover:border-primary transition-colors">
            {coverImageUrl ? (
              <>
                {coverImageUrl.match(/\.(mp4|mov|avi|webm)$/i) ? (
                  <video
                    src={coverImageUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    controls={false}
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <img
                    src={coverImageUrl || "/placeholder.svg"}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="sm">
                    Change Cover
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm">Upload Cover Image/Video</span>
              </div>
            )}
          </div>
        ) : (
          <Button variant="outline" className="w-full bg-transparent">
            <UploadCloud className="mr-2 h-4 w-4" /> Upload Media
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isCoverImage ? "Upload Cover Image/Video" : "Upload Media"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="flex-1 flex flex-col p-0">
            <div
              {...getRootProps()}
              className={cn(
                "flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">Drag 'n' drop files here, or click to select files</p>
              <p className="text-sm text-gray-500">
                {isCoverImage ? "Image or Video (Max 1 file)" : "Images or Videos (Max 5 files)"}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="media-url">Or insert from URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="media-url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <Button onClick={handleUrlSubmit}>
                  <LinkIcon className="mr-2 h-4 w-4" /> Insert URL
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2">Uploading Files:</h3>
              <ScrollArea className="h-32 pr-4">
                {files.length === 0 && <p className="text-sm text-gray-500">No files selected.</p>}
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {file.type === "image" ? (
                        <ImageIcon className="w-5 h-5 text-gray-500 shrink-0" />
                      ) : (
                        <Video className="w-5 h-5 text-gray-500 shrink-0" />
                      )}
                      <span className="truncate text-sm">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === "uploading" && <Progress value={file.progress} className="w-24 h-2" />}
                      {file.status === "completed" && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {file.status === "failed" && <span className="text-red-500 text-xs">Failed</span>}
                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleRemoveFile(file)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>
          <TabsContent value="gallery" className="flex-1 flex flex-col p-0">
            <div className="grid grid-cols-3 gap-4 overflow-y-auto p-4">
              {/* This is a placeholder for your media gallery.
                  You would fetch existing uploaded media from Supabase Storage here. */}
              {files
                .filter((f) => f.status === "completed")
                .map((file) => (
                  <div
                    key={file.id}
                    className="relative group aspect-video rounded-lg overflow-hidden border cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectExistingFile(file)}
                  >
                    {file.type === "image" ? (
                      <img
                        src={file.url || "/placeholder.svg"}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={file.url}
                        className="w-full h-full object-cover"
                        controls={false}
                        autoPlay
                        loop
                        muted
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="sm">
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              {files.filter((f) => f.status === "completed").length === 0 && (
                <p className="col-span-3 text-center text-gray-500">
                  No uploaded media found. Upload some files first!
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
