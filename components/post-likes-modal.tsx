"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Loader2 } from "lucide-react"
import { getPostLikes } from "@/lib/posts"
import { FollowButton } from "./follow-button"

interface PostLikesModalProps {
  postId: string
  isOpen: boolean
  onClose: () => void
  likesCount: number
}

export function PostLikesModal({ postId, isOpen, onClose, likesCount }: PostLikesModalProps) {
  const [likes, setLikes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && postId) {
      loadLikes()
    }
  }, [isOpen, postId])

  const loadLikes = async () => {
    setLoading(true)
    try {
      const likesData = await getPostLikes(postId)
      setLikes(likesData)
    } catch (error) {
      console.error("Error loading likes:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>
              Liked by {likesCount} {likesCount === 1 ? "person" : "people"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : likes.length > 0 ? (
            <div className="space-y-3">
              {likes.map((like) => (
                <div key={like.user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={like.user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{like.user.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold">{like.user.full_name}</span>
                        {like.user.verified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">@{like.user.username}</span>
                    </div>
                  </div>
                  <FollowButton userId={like.user.id} username={like.user.username} size="sm" variant="outline" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No likes yet</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
