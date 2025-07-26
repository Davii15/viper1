-- ✅ Run this to sync all post counts and fix any inconsistencies
SELECT sync_post_counts();

-- ✅ Verify the functions work
SELECT * FROM get_post_stats('your-post-id-here'::UUID);

-- ✅ Test the increment functions
-- SELECT increment_likes_count('your-post-id-here'::UUID);
-- SELECT increment_views_count('your-post-id-here'::UUID);
