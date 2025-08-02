"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"

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
  const { user } = useAuth()

  const createOrGetDirectConversation = async (otherUserId: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      console.log("💬 Creating/getting conversation with:", otherUserId)

      // Check if conversation already exists
      const { data: existingConversation, error: searchError } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:conversation_participants(user_id)
        `)
        .eq("type", "direct")
        .limit(1)
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        throw searchError
      }

      if (existingConversation) {
        const participantIds = existingConversation.participants.map((p: any) => p.user_id)
        if (participantIds.includes(user.id) && participantIds.includes(otherUserId)) {
          console.log("✅ Found existing conversation:", existingConversation.id)
          return existingConversation
        }
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          type: "direct",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) throw createError

      // Add participants
      const { error: participantsError } = await supabase.from("conversation_participants").insert([
        { conversation_id: newConversation.id, user_id: user.id },
        { conversation_id: newConversation.id, user_id: otherUserId },
      ])

      if (participantsError) throw participantsError

      console.log("✅ Created new conversation:", newConversation.id)
      return newConversation
    } catch (error) {
      console.error("❌ Error creating conversation:", error)
      throw error
    }
  }

  const handleStartChat = async () => {
    if (!user) {
      router.push("/auth/signin")
      return
    }

    if (authorId === user.id) {
      // Can't message yourself
      return
    }

    setLoading(true)
    try {
      const conversation = await createOrGetDirectConversation(authorId)
      router.push(`/chat?conversation=${conversation.id}`)
    } catch (error) {
      console.error("❌ Error starting chat:", error)
      // TODO: Show error toast
    } finally {
      setLoading(false)
    }
  }

  // Don't show button for own posts
  if (user && authorId === user.id) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartChat}
      disabled={loading}
      className="flex items-center space-x-1 touch-target"
      title={`Message ${authorName}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
      <span className="hidden sm:inline">Message</span>
    </Button>
  )
}
