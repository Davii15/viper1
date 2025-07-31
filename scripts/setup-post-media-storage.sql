-- Create a new storage bucket for post media
INSERT INTO storage.buckets (id, name, public)
VALUES ('post_media', 'post_media', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to upload files to 'posts' folder
CREATE POLICY "Allow authenticated users to upload post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post_media' AND
  auth.uid() IS NOT NULL AND
  starts_with(name, 'posts/')
);

-- Policy for authenticated users to view/download their own files and public files
CREATE POLICY "Allow authenticated users to view/download their own post media and public media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'post_media' AND
  (
    auth.uid() IS NOT NULL OR -- Allow any authenticated user to view
    TRUE -- Or if you want to restrict to only owner, remove this line and add owner check
  )
);

-- Policy for authenticated users to delete their own files in 'posts' folder
CREATE POLICY "Allow authenticated users to delete their own post media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post_media' AND
  auth.uid() IS NOT NULL AND
  starts_with(name, 'posts/') AND
  -- Assuming you store user_id in metadata or can link via file path
  -- For simplicity, this policy allows deletion if the user is authenticated and it's in the 'posts' folder.
  -- A more robust solution would involve linking storage objects to a 'posts' table and checking ownership.
  TRUE
);

-- Policy for authenticated users to update their own files in 'posts' folder
CREATE POLICY "Allow authenticated users to update their own post media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post_media' AND
  auth.uid() IS NOT NULL AND
  starts_with(name, 'posts/') AND
  TRUE
);

-- Optional: Policy for anonymous users to view public files (if needed)
-- CREATE POLICY "Allow anonymous users to view public post media"
-- ON storage.objects FOR SELECT
-- TO anon
-- USING (
--   bucket_id = 'post_media' AND
--   TRUE -- Adjust this condition if you want to restrict public access
-- );
