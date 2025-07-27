-- Create function to get trending topics
CREATE OR REPLACE FUNCTION get_trending_topics(topic_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  post_count BIGINT,
  engagement_score BIGINT,
  growth_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_stats AS (
    SELECT 
      t.name as topic_name,
      COUNT(pt.post_id) as posts_count,
      COALESCE(SUM(p.likes_count + p.comments_count * 2 + p.views_count * 0.1), 0) as total_engagement,
      -- Calculate growth rate (posts in last 7 days vs previous 7 days)
      CASE 
        WHEN COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '14 days' AND p.created_at < NOW() - INTERVAL '7 days' THEN 1 END) > 0
        THEN (
          COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::NUMERIC - 
          COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '14 days' AND p.created_at < NOW() - INTERVAL '7 days' THEN 1 END)::NUMERIC
        ) / COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '14 days' AND p.created_at < NOW() - INTERVAL '7 days' THEN 1 END)::NUMERIC * 100
        ELSE 0
      END as growth_percentage
    FROM topics t
    LEFT JOIN post_topics pt ON t.id = pt.topic_id
    LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
    WHERE p.created_at >= NOW() - INTERVAL '30 days' OR p.created_at IS NULL
    GROUP BY t.id, t.name
    HAVING COUNT(pt.post_id) > 0
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY total_engagement DESC, posts_count DESC)::TEXT as id,
    topic_name as name,
    posts_count as post_count,
    total_engagement::BIGINT as engagement_score,
    ROUND(growth_percentage, 1) as growth_rate
  FROM topic_stats
  ORDER BY total_engagement DESC, posts_count DESC
  LIMIT topic_limit;
END;
$$ LANGUAGE plpgsql;

-- Create topics table if it doesn't exist
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_topics junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, topic_id)
);

-- Insert some default topics
INSERT INTO topics (name, description) VALUES
  ('Ubuntu Philosophy', 'Discussions about Ubuntu philosophy and African humanism'),
  ('African Tech', 'Technology innovations and developments across Africa'),
  ('Startup Stories', 'Entrepreneurship and startup experiences in Africa'),
  ('Cultural Heritage', 'African culture, traditions, and heritage preservation'),
  ('Innovation', 'Creative solutions and innovations from African minds'),
  ('Education', 'Educational initiatives and learning in Africa'),
  ('Health & Wellness', 'Health, wellness, and medical advances in Africa'),
  ('Agriculture', 'Agricultural innovations and food security'),
  ('Climate Change', 'Environmental issues and climate action in Africa'),
  ('Arts & Music', 'African arts, music, and creative expressions')
ON CONFLICT (name) DO NOTHING;
