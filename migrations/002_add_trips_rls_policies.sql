-- Add RLS policies for trips table
-- This migration adds Row Level Security policies to the trips table

-- Ensure RLS is enabled on trips table
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Users can view their own trips
CREATE POLICY "Users can view their own trips" ON trips
  FOR SELECT USING (owner_id = auth.uid());

-- Users can insert their own trips
CREATE POLICY "Users can insert their own trips" ON trips
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own trips
CREATE POLICY "Users can update their own trips" ON trips
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own trips
CREATE POLICY "Users can delete their own trips" ON trips
  FOR DELETE USING (owner_id = auth.uid());

-- Public trips can be viewed by anyone (for explore feature)
CREATE POLICY "Anyone can view public trips" ON trips
  FOR SELECT USING (is_public = true); 