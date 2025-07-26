-- Insert categories
INSERT INTO categories (name, icon, color, description) VALUES
('Sports', '⚽', 'bg-green-500', 'Sports news, updates, and discussions'),
('Health', '🏥', 'bg-red-500', 'Health tips, medical news, and wellness'),
('Agriculture', '🌾', 'bg-yellow-500', 'Farming, agriculture technology, and food security'),
('Beauty', '💄', 'bg-pink-500', 'Beauty tips, fashion, and lifestyle'),
('Lifestyle', '✨', 'bg-purple-500', 'Lifestyle, culture, and personal development'),
('Finance', '💰', 'bg-emerald-500', 'Finance, investment, and economic news'),
('Technology', '💻', 'bg-blue-500', 'Tech news, programming, and innovation'),
('Economics', '📈', 'bg-indigo-500', 'Economic analysis and market trends'),
('Security', '🔒', 'bg-gray-500', 'Cybersecurity and safety topics'),
('Food', '🍕', 'bg-orange-500', 'Recipes, food culture, and culinary arts'),
('Travel', '✈️', 'bg-cyan-500', 'Travel guides, destinations, and experiences'),
('Education', '📚', 'bg-violet-500', 'Educational content and learning resources');

-- Insert sample users (these will be created through auth)
-- The actual user creation will happen through Supabase Auth

-- Insert sample posts (will be created by authenticated users)
-- This is just for reference structure
