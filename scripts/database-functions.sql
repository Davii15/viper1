-- ✅ Fixed database functions for proper counting and interactions
-- Using correct table names: 'likes' instead of 'post_likes'

-- Function to increment likes count
CREATE OR REPLACE FUNCTION increment_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes_count = likes_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes_count = GREATEST(likes_count - 1, 0),
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment views count
CREATE OR REPLACE FUNCTION increment_views_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET views_count = views_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment comments count
CREATE OR REPLACE FUNCTION increment_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments_count = comments_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement comments count
CREATE OR REPLACE FUNCTION decrement_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments_count = GREATEST(comments_count - 1, 0),
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment shares count
CREATE OR REPLACE FUNCTION increment_shares_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET shares_count = shares_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update trending score based on engagement
CREATE OR REPLACE FUNCTION update_trending_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate trending score based on recent activity
  UPDATE posts 
  SET trending_score = (
    (likes_count * 3) + 
    (comments_count * 5) + 
    (views_count * 1) + 
    (shares_count * 4)
  ) * (
    CASE 
      WHEN created_at > NOW() - INTERVAL '24 hours' THEN 2.0
      WHEN created_at > NOW() - INTERVAL '7 days' THEN 1.5
      WHEN created_at > NOW() - INTERVAL '30 days' THEN 1.0
      ELSE 0.5
    END
  ),
  is_trending = (
    (likes_count * 3) + 
    (comments_count * 5) + 
    (views_count * 1) + 
    (shares_count * 4)
  ) > 50 AND created_at > NOW() - INTERVAL '7 days',
  updated_at = NOW()
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic trending score updates
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_post_trending_on_like ON likes;
DROP TRIGGER IF EXISTS update_post_trending_on_comment ON comments;
DROP TRIGGER IF EXISTS update_post_trending_on_view ON post_views;

-- Create new triggers with correct table names
CREATE TRIGGER update_post_trending_on_like
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_trending_score();

-- Only create comment trigger if comments table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comments') THEN
    CREATE TRIGGER update_post_trending_on_comment
      AFTER INSERT OR DELETE ON comments
      FOR EACH ROW
      EXECUTE FUNCTION update_trending_score();
  END IF;
END $$;

-- Only create view trigger if post_views table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'post_views') THEN
    CREATE TRIGGER update_post_trending_on_view
      AFTER INSERT ON post_views
      FOR EACH ROW
      EXECUTE FUNCTION update_trending_score();
  END IF;
END $$;

-- Function to get post statistics
CREATE OR REPLACE FUNCTION get_post_stats(post_id UUID)
RETURNS TABLE(
  likes_count BIGINT,
  comments_count BIGINT,
  views_count BIGINT,
  shares_count BIGINT,
  bookmarks_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*) FROM likes WHERE likes.post_id = get_post_stats.post_id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM comments WHERE comments.post_id = get_post_stats.post_id), 0) as comments_count,
    COALESCE((SELECT COUNT(*) FROM post_views WHERE post_views.post_id = get_post_stats.post_id), 0) as views_count,
    COALESCE(p.shares_count, 0) as shares_count,
    COALESCE((SELECT COUNT(*) FROM bookmarks WHERE bookmarks.post_id = get_post_stats.post_id), 0) as bookmarks_count
  FROM posts p
  WHERE p.id = get_post_stats.post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to sync post counts (run this to fix any inconsistencies)
CREATE OR REPLACE FUNCTION sync_post_counts()
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET 
    likes_count = COALESCE((SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id), 0),
    comments_count = COALESCE((SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id), 0),
    views_count = COALESCE((SELECT COUNT(DISTINCT user_id) FROM post_views WHERE post_views.post_id = posts.id), 0),
    updated_at = NOW()
  WHERE id IN (
    SELECT DISTINCT post_id FROM likes
    UNION
    SELECT DISTINCT post_id FROM comments
    UNION 
    SELECT DISTINCT post_id FROM post_views
    UNION
    SELECT DISTINCT post_id FROM bookmarks
  );
  
  -- Update trending scores for all posts
  UPDATE posts 
  SET trending_score = (
    (likes_count * 3) + 
    (comments_count * 5) + 
    (views_count * 1) + 
    (shares_count * 4)
  ) * (
    CASE 
      WHEN created_at > NOW() - INTERVAL '24 hours' THEN 2.0
      WHEN created_at > NOW() - INTERVAL '7 days' THEN 1.5
      WHEN created_at > NOW() - INTERVAL '30 days' THEN 1.0
      ELSE 0.5
    END
  ),
  is_trending = (
    (likes_count * 3) + 
    (comments_count * 5) + 
    (views_count * 1) + 
    (shares_count * 4)
  ) > 50 AND created_at > NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
