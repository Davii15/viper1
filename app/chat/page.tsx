"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequireAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/supabase"

// ✅ Chat types
interface Conversation {
  id: string
  type: "direct" | "group"
  name?: string
  participants: User[]
  last_message?: {
    content: string
    created_at: string
    user: User
  }
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  conversation_id: string
  user_id: string
  content: string
  type: "text" | "image" | "file"
  created_at: string
  user: User
}

export default function ChatPage() {
  // ✅ Use centralized auth system
  const { user, loading: authLoading } = useRequireAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // ✅ Load conversations when user is available
  useEffect(() => {
    if (user && !authLoading) {
      loadConversations()

      // Check for conversation ID in URL
      const conversationId = searchParams.get("conversation")
      if (conversationId) {
        loadConversation(conversationId)
      }
    }
  }, [user, authLoading, searchParams])

  const loadConversations = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log("💬 Loading conversations...")

      // TODO: Replace with your actual conversations query
      // This is a placeholder structure
      const { data: conversationsData, error } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:conversation_participants(
            user:users(*)
          ),
          last_message:messages(
            content,
            created_at,
            user:users(*)
          )
        `)
        .order("updated_at", { ascending: false })

      if (error) {
        console.warn("⚠️ Conversations table might not exist yet:", error)
        setConversations([])
        return
      }

      const formattedConversations =
        conversationsData?.map((conv: any) => ({
          ...conv,
          participants: conv.participants?.map((p: any) => p.user) || [],
          last_message: conv.last_message?.[0] || null,
        })) || []

      setConversations(formattedConversations)
      console.log(`✅ Loaded ${formattedConversations.length} conversations`)
    } catch (error) {
      console.error("❌ Error loading conversations:", error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      console.log("💬 Loading conversation:", conversationId)

      // Find conversation in loaded conversations
      const conversation = conversations.find((c) => c.id === conversationId)
      if (conversation) {
        setSelectedConversation(conversation)
        await loadMessages(conversationId)
      }
    } catch (error) {
      console.error("❌ Error loading conversation:", error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      console.log("📨 Loading messages for conversation:", conversationId)

      // TODO: Replace with your actual messages query
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select(`
          *,
          user:users(*)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) {
        console.warn("⚠️ Messages table might not exist yet:", error)
        setMessages([])
        return
      }

      setMessages(messagesData || [])
      console.log(`✅ Loaded ${messagesData?.length || 0} messages`)
    } catch (error) {
      console.error("❌ Error loading messages:", error)
      setMessages([])
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    loadMessages(conversation.id)

    // Update URL
    router.push(`/chat?conversation=${conversation.id}`)
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
    router.push("/chat")
  }

  // ✅ Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading chat...</p>
        </motion.div>
      </div>
    )
  }

  // ✅ useRequireAuth will handle redirect if no user
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* African Pattern Background */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-2xl animate-pulse">💬</div>
        <div className="absolute top-20 right-20 text-xl animate-bounce">✨</div>
        <div className="absolute bottom-20 left-20 text-2xl animate-pulse">🌍</div>
        <div className="absolute bottom-10 right-10 text-xl animate-bounce">💫</div>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="touch-target">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">{selectedConversation && isMobile ? "Chat" : "Messages"}</h1>
          </div>
          {selectedConversation && isMobile && (
            <Button variant="ghost" size="sm" onClick={handleBackToList} className="touch-target">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl h-[calc(100vh-80px)]">
        <Card className="h-full overflow-hidden">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`${isMobile ? (selectedConversation ? "hidden" : "w-full") : "w-1/3"} border-r`}>
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Conversations</h2>
              </div>

              <div className="overflow-y-auto h-full">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  </div>
                ) : conversations.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`w-full p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-target ${
                          selectedConversation?.id === conversation.id ? "bg-orange-50 dark:bg-orange-900/20" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-semibold">
                            {conversation.type === "direct"
                              ? conversation.participants.find((p) => p.id !== user.id)?.full_name?.[0] || "?"
                              : "G"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {conversation.type === "direct"
                                ? conversation.participants.find((p) => p.id !== user.id)?.full_name || "Unknown User"
                                : conversation.name || "Group Chat"}
                            </div>
                            {conversation.last_message && (
                              <div className="text-sm text-gray-500 truncate">{conversation.last_message.content}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="font-semibold mb-2">No conversations yet</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Start a conversation by messaging someone from their profile
                    </p>
                    <Link href="/explore">
                      <Button variant="outline" className="touch-target bg-transparent">
                        Explore Users
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className={`${isMobile ? (selectedConversation ? "w-full" : "hidden") : "flex-1"}`}>
              {selectedConversation ? (
                <div className="flex flex-col h-full">
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedConversation.type === "direct"
                        ? selectedConversation.participants.find((p) => p.id !== user.id)?.full_name?.[0] || "?"
                        : "G"}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {selectedConversation.type === "direct"
                          ? selectedConversation.participants.find((p) => p.id !== user.id)?.full_name || "Unknown User"
                          : selectedConversation.name || "Group Chat"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedConversation.type === "direct"
                          ? "Direct Message"
                          : `${selectedConversation.participants.length} members`}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length > 0 ? (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.user_id === user.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.user_id === user.id
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {message.user_id !== user.id && (
                              <div className="text-xs font-medium mb-1 opacity-70">{message.user.full_name}</div>
                            )}
                            <div>{message.content}</div>
                            <div className={`text-xs mt-1 opacity-70`}>
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No messages yet</p>
                          <p className="text-gray-400 text-sm">Start the conversation!</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 touch-target"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            // TODO: Implement send message
                            console.log("Send message functionality to be implemented")
                          }
                        }}
                      />
                      <Button className="bg-orange-500 hover:bg-orange-600 touch-target">Send</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Select a conversation</h3>
                  <p className="text-gray-600 mb-4">Choose a conversation from the list to start chatting</p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">💡 Pro Tip:</p>
                    <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                      You can start conversations by clicking "Message" on any user's profile or post!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
