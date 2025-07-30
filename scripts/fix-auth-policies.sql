-- ✅ Fix RLS policies for user profile creation during email verification
-- (Corrected version without sequence references)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- ✅ Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- ✅ Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- ✅ Allow users to insert their own profile during signup/verification
CREATE POLICY "Users can insert own profile" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- ✅ Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ✅ Grant necessary permissions (no sequence needed for UUID)
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;

-- ✅ Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ✅ Verify the policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
