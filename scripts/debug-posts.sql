-- Debug script to check posts creation
-- Run this to see if posts are being created in the database

-- Check recent posts
SELECT 
  p.id,
  p.title,
  p.content,
  p.status,
  p.created_at,
  u.username,
  u.full_name
FROM posts p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Check post counts by user
SELECT 
  u.username,
  u.full_name,
  COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.username, u.full_name
ORDER BY post_count DESC;

-- Check if RLS policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'posts';

-- Check categories and post_categories
SELECT 
  c.name as category_name,
  COUNT(pc.post_id) as posts_count
FROM categories c
LEFT JOIN post_categories pc ON c.id = pc.category_id
GROUP BY c.id, c.name
ORDER BY posts_count DESC;
