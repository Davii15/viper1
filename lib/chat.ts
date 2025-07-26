import { createClient } from "./supabase/client"
import type { User } from "./supabase"

const supabase = createClient()

export interface Conversation {
  id: string
  type: "direct" | "group"
  name?: string
  description?: string
  avatar_url?: string
  created_by: string
  created_at: string
  updated_at: string
  last_message_at: string
  participants?: ConversationParticipant[]
  last_message?: Message
  unread_count?: number
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  role: "admin" | "member"
  joined_at: string
  last_read_at: string
  is_muted: boolean
  is_pinned: boolean
  user?: User
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content?: string
  message_type: "text" | "image" | "file" | "audio" | "video" | "location" | "system"
  media_url?: string
  media_type?: string
  media_size?: number
  media_duration?: number
  reply_to_id?: string
  forwarded_from_id?: string
  edited_at?: string
  deleted_at?: string
  created_at: string
  metadata?: any
  sender?: User
  reply_to?: Message
  reactions?: MessageReaction[]
  read_receipts?: MessageReadReceipt[]
  is_read?: boolean
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  user?: User
}

export interface MessageReadReceipt {
  id: string
  message_id: string
  user_id: string
  read_at: string
  user?: User
}

export interface TypingIndicator {
  id: string
  conversation_id: string
  user_id: string
  started_at: string
  user?: User
}

// Get user's conversations
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        participants:conversation_participants(
          *,
          user:users(*)
        )
      `)
      .order("last_message_at", { ascending: false })

    if (error) throw error

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get last message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select(`
            *,
            sender:users(*)
          `)
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        // Get unread count
        const participant = conv.participants?.find((p: any) => p.user_id === user.id)
        const lastReadAt = participant?.last_read_at || "1970-01-01T00:00:00Z"

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .gt("created_at", lastReadAt)
          .neq("sender_id", user.id)

        return {
          ...conv,
          last_message: lastMessage,
          unread_count: unreadCount || 0,
        }
      }),
    )

    return conversationsWithDetails
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return []
  }
}

// Create or get direct conversation with another user
export const createOrGetDirectConversation = async (otherUserId: string): Promise<Conversation> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select(`
        *,
        participants:conversation_participants(
          *,
          user:users(*)
        )
      `)
      .eq("type", "direct")
      .limit(1)
      .single()

    // Filter to find conversation with both users
    if (existingConversation) {
      const participantIds = existingConversation.participants?.map((p: any) => p.user_id) || []
      if (participantIds.includes(user.id) && participantIds.includes(otherUserId)) {
        return existingConversation
      }
    }

    // Create new conversation
    const { data: newConversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        type: "direct",
        created_by: user.id,
      })
      .select()
      .single()

    if (convError) throw convError

    // Add participants
    const { error: participantsError } = await supabase.from("conversation_participants").insert([
      {
        conversation_id: newConversation.id,
        user_id: user.id,
        role: "member",
      },
      {
        conversation_id: newConversation.id,
        user_id: otherUserId,
        role: "member",
      },
    ])

    if (participantsError) throw participantsError

    // Fetch the complete conversation with participants
    const { data: completeConversation, error: fetchError } = await supabase
      .from("conversations")
      .select(`
        *,
        participants:conversation_participants(
          *,
          user:users(*)
        )
      `)
      .eq("id", newConversation.id)
      .single()

    if (fetchError) throw fetchError

    return completeConversation
  } catch (error) {
    console.error("Error creating/getting conversation:", error)
    throw error
  }
}

// Get messages for a conversation
export const getMessages = async (conversationId: string, page = 1, limit = 50): Promise<Message[]> => {
  try {
    const offset = (page - 1) * limit

    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:users(*),
        reply_to:messages(
          *,
          sender:users(*)
        ),
        reactions:message_reactions(
          *,
          user:users(*)
        ),
        read_receipts:message_read_receipts(
          *,
          user:users(*)
        )
      `)
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return (messages || []).reverse() // Reverse to show oldest first
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

// Send a message
export const sendMessage = async (
  conversationId: string,
  content: string,
  messageType: Message["message_type"] = "text",
  mediaUrl?: string,
  replyToId?: string,
): Promise<Message> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        message_type: messageType,
        media_url: mediaUrl,
        reply_to_id: replyToId,
      })
      .select(`
        *,
        sender:users(*),
        reply_to:messages(
          *,
          sender:users(*)
        )
      `)
      .single()

    if (error) throw error

    // Update last read timestamp for sender
    await updateLastRead(conversationId)

    return message
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

// Edit a message
export const editMessage = async (messageId: string, newContent: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("messages")
      .update({
        content: newContent,
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId)

    if (error) throw error
  } catch (error) {
    console.error("Error editing message:", error)
    throw error
  }
}

// Delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("messages")
      .update({
        deleted_at: new Date().toISOString(),
        content: null,
        media_url: null,
      })
      .eq("id", messageId)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting message:", error)
    throw error
  }
}

// Add reaction to message
export const addReaction = async (messageId: string, emoji: string): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase.from("message_reactions").upsert(
      {
        message_id: messageId,
        user_id: user.id,
        emoji,
      },
      { onConflict: "message_id,user_id,emoji" },
    )

    if (error) throw error
  } catch (error) {
    console.error("Error adding reaction:", error)
    throw error
  }
}

// Remove reaction from message
export const removeReaction = async (messageId: string, emoji: string): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)

    if (error) throw error
  } catch (error) {
    console.error("Error removing reaction:", error)
    throw error
  }
}

// Update last read timestamp
export const updateLastRead = async (conversationId: string): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase
      .from("conversation_participants")
      .update({
        last_read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)

    if (error) throw error
  } catch (error) {
    console.error("Error updating last read:", error)
    throw error
  }
}

// Start typing indicator
export const startTyping = async (conversationId: string): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase.from("typing_indicators").upsert(
      {
        conversation_id: conversationId,
        user_id: user.id,
        started_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id,user_id" },
    )

    if (error) throw error
  } catch (error) {
    console.error("Error starting typing:", error)
  }
}

// Stop typing indicator
export const stopTyping = async (conversationId: string): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase
      .from("typing_indicators")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)

    if (error) throw error
  } catch (error) {
    console.error("Error stopping typing:", error)
  }
}

// Get typing indicators for a conversation
export const getTypingIndicators = async (conversationId: string): Promise<TypingIndicator[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { data: indicators, error } = await supabase
      .from("typing_indicators")
      .select(`
        *,
        user:users(*)
      `)
      .eq("conversation_id", conversationId)
      .neq("user_id", user.id) // Don't show own typing indicator
      .gt("started_at", new Date(Date.now() - 10000).toISOString()) // Only recent indicators

    if (error) throw error

    return indicators || []
  } catch (error) {
    console.error("Error fetching typing indicators:", error)
    return []
  }
}

// Search messages
export const searchMessages = async (query: string, conversationId?: string): Promise<Message[]> => {
  try {
    let searchQuery = supabase
      .from("messages")
      .select(`
        *,
        sender:users(*),
        conversation:conversations(*)
      `)
      .ilike("content", `%${query}%`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50)

    if (conversationId) {
      searchQuery = searchQuery.eq("conversation_id", conversationId)
    }

    const { data: messages, error } = await searchQuery

    if (error) throw error

    return messages || []
  } catch (error) {
    console.error("Error searching messages:", error)
    return []
  }
}

// Real-time subscriptions
export const subscribeToConversations = (callback: (payload: any) => void) => {
  return supabase
    .channel("conversations")
    .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, callback)
    .on("postgres_changes", { event: "*", schema: "public", table: "conversation_participants" }, callback)
    .subscribe()
}

export const subscribeToMessages = (conversationId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "message_reactions",
      },
      callback,
    )
    .subscribe()
}

export const subscribeToTyping = (conversationId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`typing:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "typing_indicators",
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback,
    )
    .subscribe()
}
