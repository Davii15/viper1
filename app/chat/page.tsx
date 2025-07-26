"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ConversationsList } from "@/components/chat/conversations-list"
import { ChatWindow } from "@/components/chat/chat-window"
import type { Conversation } from "@/lib/chat"
import type { User } from "@/lib/supabase"

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.replace("/auth/signin")
        return
      }
      setUser(currentUser)
    } catch (error) {
      console.error("Error checking auth:", error)
      router.replace("/auth/signin")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading chat...</p>
        </motion.div>
      </div>
    )
  }

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
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Chat</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl h-[calc(100vh-80px)]">
        <Card className="h-full overflow-hidden">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`${isMobile ? (selectedConversation ? "hidden" : "w-full") : "w-1/3"} border-r`}>
              <ConversationsList
                currentUser={user}
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversation?.id}
              />
            </div>

            {/* Chat Window */}
            <div className={`${isMobile ? (selectedConversation ? "w-full" : "hidden") : "flex-1"}`}>
              {selectedConversation ? (
                <ChatWindow conversation={selectedConversation} currentUser={user} onBack={handleBackToList} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Select a conversation</h3>
                  <p className="text-gray-600 mb-4">Choose a conversation from the list to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
