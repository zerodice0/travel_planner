-- Add RLS policies for places_of_interest table
-- This migration adds Row Level Security policies to the places_of_interest table

-- Ensure RLS is enabled on places_of_interest table
ALTER TABLE places_of_interest ENABLE ROW LEVEL SECURITY;

-- Users can view their own places
CREATE POLICY "Users can view their own places" ON places_of_interest
  FOR SELECT USING (owner_id = auth.uid());

-- Users can insert their own places
CREATE POLICY "Users can insert their own places" ON places_of_interest
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own places
CREATE POLICY "Users can update their own places" ON places_of_interest
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own places
CREATE POLICY "Users can delete their own places" ON places_of_interest
  FOR DELETE USING (owner_id = auth.uid());

-- Public places can be viewed by anyone (if needed for sharing)
CREATE POLICY "Anyone can view public places" ON places_of_interest
  FOR SELECT USING (is_public = true); 