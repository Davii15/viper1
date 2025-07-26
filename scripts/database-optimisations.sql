-- ✅ Add database indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ✅ Optimize RLS policies
DROP POLICY IF EXISTS "Can read own user" ON users;

-- ✅ More efficient RLS policy
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ✅ Add policy for profile creation during signup
CREATE POLICY "users_insert_signup" ON users
  FOR INSERT WITH CHECK (true);

-- ✅ Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ✅ Add performance indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_trending ON posts(is_trending, trending_score DESC);

-- ✅ Add indexes for user interactions
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_post ON bookmarks(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_post ON post_views(user_id, post_id);
