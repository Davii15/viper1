"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Search,
  ArrowLeft,
  Edit,
  Trash2,
  Reply,
  Forward,
  Copy,
  ImageIcon,
  Mic,
  X,
  Check,
  CheckCheck,
} from "lucide-react"
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  updateLastRead,
  startTyping,
  stopTyping,
  getTypingIndicators,
  subscribeToMessages,
  subscribeToTyping,
} from "@/lib/chat"
import type { Conversation, Message, TypingIndicator } from "@/lib/chat"
import type { User } from "@/lib/supabase"

interface ChatWindowProps {
  conversation: Conversation
  currentUser: User
  onBack: () => void
}

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "😡", "👏", "🔥", "💯", "🎉"]

export function ChatWindow({ conversation, currentUser, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Get other participant for direct chats
  const otherParticipant = conversation.participants?.find((p) => p.user_id !== currentUser.id)

  useEffect(() => {
    loadMessages()
    updateLastRead(conversation.id)

    // Subscribe to real-time updates
    const messagesSubscription = subscribeToMessages(conversation.id, handleMessageUpdate)
    const typingSubscription = subscribeToTyping(conversation.id, handleTypingUpdate)

    return () => {
      messagesSubscription.unsubscribe()
      typingSubscription.unsubscribe()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [conversation.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    setIsLoading(true)
    try {
      const fetchedMessages = await getMessages(conversation.id)
      setMessages(fetchedMessages)
    } catch (error) {
      console.error("Error loading messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMessageUpdate = useCallback((payload: any) => {
    if (payload.eventType === "INSERT" && payload.table === "messages") {
      const newMessage = payload.new
      setMessages((prev) => [...prev, newMessage])
      updateLastRead(conversation.id)
    } else if (payload.eventType === "UPDATE" && payload.table === "messages") {
      const updatedMessage = payload.new
      setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)))
    } else if (payload.eventType === "DELETE" && payload.table === "messages") {
      const deletedMessage = payload.old
      setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id))
    }
  }, [])

  const handleTypingUpdate = useCallback(async () => {
    const indicators = await getTypingIndicators(conversation.id)
    setTypingIndicators(indicators)
  }, [conversation.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      await sendMessage(conversation.id, newMessage, "text", undefined, replyingTo?.id)
      setNewMessage("")
      setReplyingTo(null)
      stopTyping(conversation.id)
      setIsTyping(false)
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (value: string) => {
    setNewMessage(value)

    if (value.trim() && !isTyping) {
      setIsTyping(true)
      startTyping(conversation.id)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping(conversation.id)
    }, 2000)
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return

    try {
      await editMessage(messageId, editContent)
      setEditingMessage(null)
      setEditContent("")
    } catch (error) {
      console.error("Error editing message:", error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const message = messages.find((m) => m.id === messageId)
      const existingReaction = message?.reactions?.find((r) => r.user_id === currentUser.id && r.emoji === emoji)

      if (existingReaction) {
        await removeReaction(messageId, emoji)
      } else {
        await addReaction(messageId, emoji)
      }
    } catch (error) {
      console.error("Error handling reaction:", error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const getMessageStatus = (message: Message) => {
    if (message.sender_id !== currentUser.id) return null

    const readReceipts = message.read_receipts || []
    const otherParticipants = conversation.participants?.filter((p) => p.user_id !== currentUser.id) || []

    if (readReceipts.length === otherParticipants.length) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />
    } else if (readReceipts.length > 0) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />
    } else {
      return <Check className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherParticipant?.user?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{otherParticipant?.user?.full_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">
              {conversation.type === "direct" ? otherParticipant?.user?.full_name : conversation.name || "Group Chat"}
            </h3>
            <div className="text-sm text-gray-500">
              {typingIndicators.length > 0 ? (
                <span className="text-green-600">
                  {typingIndicators.length === 1
                    ? `${typingIndicators[0].user?.full_name} is typing...`
                    : `${typingIndicators.length} people are typing...`}
                </span>
              ) : conversation.type === "direct" ? (
                "Online"
              ) : (
                `${conversation.participants?.length || 0} members`
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setShowSearch(!showSearch)}>
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Block User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 border-b bg-gray-50"
          >
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 bg-blue-50 border-b border-l-4 border-l-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-600">Replying to {replyingTo.sender?.full_name}</div>
                <div className="text-sm text-gray-600 truncate">{replyingTo.content}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUser.id
              const showDate =
                index === 0 || formatDate(message.created_at) !== formatDate(messages[index - 1].created_at)
              const showAvatar =
                !isOwn &&
                (index === messages.length - 1 ||
                  messages[index + 1].sender_id !== message.sender_id ||
                  new Date(messages[index + 1].created_at).getTime() - new Date(message.created_at).getTime() > 300000)

              return (
                <div key={message.id}>
                  {/* Date separator */}
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <Badge variant="secondary" className="text-xs">
                        {formatDate(message.created_at)}
                      </Badge>
                    </div>
                  )}

                  {/* Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
                  >
                    <div
                      className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      {showAvatar && !isOwn && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.sender?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{message.sender?.full_name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                      )}

                      {/* Message bubble */}
                      <div className={`${!showAvatar && !isOwn ? "ml-10" : ""}`}>
                        {/* Reply context */}
                        {message.reply_to && (
                          <div className="mb-1 p-2 bg-gray-100 rounded-lg border-l-2 border-gray-300">
                            <div className="text-xs font-medium text-gray-600">
                              {message.reply_to.sender?.full_name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{message.reply_to.content}</div>
                          </div>
                        )}

                        <div
                          className={`relative p-3 rounded-2xl ${
                            isOwn ? "bg-blue-500 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"
                          }`}
                        >
                          {/* Message content */}
                          {editingMessage === message.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px] bg-transparent border-none resize-none focus:ring-0"
                                autoFocus
                              />
                              <div className="flex justify-end space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingMessage(null)}
                                  className="text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={() => handleEditMessage(message.id)} className="text-xs">
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {message.deleted_at ? (
                                <span className="italic text-gray-500">This message was deleted</span>
                              ) : (
                                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                              )}

                              {/* Message info */}
                              <div
                                className={`flex items-center justify-between mt-1 text-xs ${
                                  isOwn ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                <span>{formatTime(message.created_at)}</span>
                                <div className="flex items-center space-x-1">
                                  {message.edited_at && <span>edited</span>}
                                  {getMessageStatus(message)}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Message actions */}
                          {!message.deleted_at && (
                            <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center space-x-1 bg-white rounded-lg shadow-lg border p-1">
                                {EMOJI_LIST.slice(0, 3).map((emoji) => (
                                  <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-lg hover:bg-gray-100"
                                    onClick={() => handleReaction(message.id, emoji)}
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                                      <Reply className="w-4 h-4 mr-2" />
                                      Reply
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Forward className="w-4 h-4 mr-2" />
                                      Forward
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy
                                    </DropdownMenuItem>
                                    {isOwn && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setEditingMessage(message.id)
                                            setEditContent(message.content || "")
                                          }}
                                        >
                                          <Edit className="w-4 h-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteMessage(message.id)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(
                              message.reactions.reduce((acc: any, reaction) => {
                                acc[reaction.emoji] = acc[reaction.emoji] || []
                                acc[reaction.emoji].push(reaction)
                                return acc
                              }, {}),
                            ).map(([emoji, reactions]: [string, any]) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className={`h-6 px-2 text-xs rounded-full ${
                                  reactions.some((r: any) => r.user_id === currentUser.id)
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-100"
                                }`}
                                onClick={() => handleReaction(message.id, emoji)}
                              >
                                {emoji} {reactions.length}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[44px] max-h-32 resize-none border-0 bg-white rounded-full px-4 py-3 focus:ring-2 focus:ring-blue-500"
              rows={1}
            />
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
              <Mic className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="rounded-full w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
