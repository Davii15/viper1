"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, MessageCircle, Users } from "lucide-react"
import { getConversations, subscribeToConversations } from "@/lib/chat"
import type { Conversation } from "@/lib/chat"
import type { User } from "@/lib/supabase"

interface ConversationsListProps {
  currentUser: User
  onSelectConversation: (conversation: Conversation) => void
  selectedConversationId?: string
}

export function ConversationsList({
  currentUser,
  onSelectConversation,
  selectedConversationId,
}: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()

    // Subscribe to real-time updates
    const subscription = subscribeToConversations(handleConversationUpdate)

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const fetchedConversations = await getConversations()
      setConversations(fetchedConversations)
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConversationUpdate = () => {
    loadConversations()
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true

    const otherParticipant = conv.participants?.find((p) => p.user_id !== currentUser.id)
    const searchTarget = conv.type === "direct" ? otherParticipant?.user?.full_name || "" : conv.name || ""

    return searchTarget.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`
    return date.toLocaleDateString()
  }

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === "group") {
      return conversation.name || "Group Chat"
    }
    const otherParticipant = conversation.participants?.find((p) => p.user_id !== currentUser.id)
    return otherParticipant?.user?.full_name || "Unknown User"
  }

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === "group") {
      return conversation.avatar_url || "/placeholder.svg"
    }
    const otherParticipant = conversation.participants?.find((p) => p.user_id !== currentUser.id)
    return otherParticipant?.user?.avatar_url || "/placeholder.svg"
  }

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) return "No messages yet"

    const message = conversation.last_message
    const isOwn = message.sender_id === currentUser.id
    const prefix = isOwn ? "You: " : ""

    if (message.deleted_at) return `${prefix}Message deleted`
    if (message.message_type === "image") return `${prefix}📷 Photo`
    if (message.message_type === "file") return `${prefix}📎 File`
    if (message.message_type === "audio") return `${prefix}🎵 Audio`
    if (message.message_type === "video") return `${prefix}🎥 Video`

    return `${prefix}${message.content || ""}`
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <Button size="sm" className="rounded-full">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-gray-600 mb-4">Start chatting with other users!</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <motion.div key={conversation.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedConversationId === conversation.id ? "bg-blue-50 border-blue-200" : ""
                  }`}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={getConversationAvatar(conversation) || "/placeholder.svg"} />
                          <AvatarFallback>
                            {conversation.type === "group" ? (
                              <Users className="w-6 h-6" />
                            ) : (
                              getConversationName(conversation)[0]
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate">{getConversationName(conversation)}</h3>
                          <div className="flex items-center space-x-2">
                            {conversation.last_message && (
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.last_message.created_at)}
                              </span>
                            )}
                            {conversation.unread_count && conversation.unread_count > 0 && (
                              <Badge className="bg-blue-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{getLastMessagePreview(conversation)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
