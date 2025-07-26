-- Chat system tables
-- Run this script to add chat functionality to your database

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(20) DEFAULT 'direct', -- 'direct', 'group'
  name VARCHAR(255), -- For group chats
  description TEXT, -- For group chats
  avatar_url TEXT, -- For group chats
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'audio', 'video', 'location', 'system'
  media_url TEXT,
  media_type VARCHAR(50), -- MIME type for media
  media_size INTEGER, -- File size in bytes
  media_duration INTEGER, -- For audio/video in seconds
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  forwarded_from_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- For additional data like location coordinates, etc.
);

-- Message reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Message read receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Typing indicators
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in" ON conversations
FOR SELECT USING (
  id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations" ON conversations
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Conversation creators can update conversations" ON conversations
FOR UPDATE USING (
  auth.uid() = created_by OR 
  auth.uid() IN (
    SELECT user_id FROM conversation_participants 
    WHERE conversation_id = id AND role = 'admin'
  )
);

-- RLS Policies for participants
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can join conversations" ON conversation_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON conversation_participants
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations" ON messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE USING (auth.uid() = sender_id);

-- RLS Policies for reactions
CREATE POLICY "Users can manage reactions in their conversations" ON message_reactions
FOR ALL USING (
  message_id IN (
    SELECT m.id FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = auth.uid()
  )
);

-- RLS Policies for read receipts
CREATE POLICY "Users can manage read receipts in their conversations" ON message_read_receipts
FOR ALL USING (
  message_id IN (
    SELECT m.id FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = auth.uid()
  )
);

-- RLS Policies for typing indicators
CREATE POLICY "Users can manage typing indicators in their conversations" ON typing_indicators
FOR ALL USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);

-- Functions for real-time updates
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW(), last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when new message is sent
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;
