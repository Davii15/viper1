"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createOrGetDirectConversation } from "@/lib/chat"

interface ChatWithAuthorButtonProps {
  authorId: string
  authorName: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
}

export function ChatWithAuthorButton({
  authorId,
  authorName,
  size = "sm",
  variant = "ghost",
}: ChatWithAuthorButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStartChat = async () => {
    setLoading(true)
    try {
      const conversation = await createOrGetDirectConversation(authorId)
      router.push(`/chat?conversation=${conversation.id}`)
    } catch (error) {
      console.error("Error starting chat:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartChat}
      disabled={loading}
      className="flex items-center space-x-1"
      title={`Message ${authorName}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
      <span className="hidden sm:inline">Message</span>
    </Button>
  )
}
