-- Add trip_places table to connect trips with places
-- This allows users to organize places by travel destinations

CREATE TABLE trip_places (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  place_id uuid REFERENCES places_of_interest(id) ON DELETE CASCADE NOT NULL,
  custom_label text,
  priority integer DEFAULT 0,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'visited', 'cancelled')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure a place can only be added once per trip
  UNIQUE(trip_id, place_id)
);

-- Add indexes for better performance
CREATE INDEX idx_trip_places_trip_id ON trip_places(trip_id);
CREATE INDEX idx_trip_places_place_id ON trip_places(place_id);
CREATE INDEX idx_trip_places_status ON trip_places(status);
CREATE INDEX idx_trip_places_priority ON trip_places(priority);

-- Add RLS (Row Level Security) policies
ALTER TABLE trip_places ENABLE ROW LEVEL SECURITY;

-- Users can only see trip_places for their own trips
CREATE POLICY "Users can view their own trip places" ON trip_places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_places.trip_id 
      AND trips.owner_id = auth.uid()
    )
  );

-- Users can only insert trip_places for their own trips  
CREATE POLICY "Users can insert trip places for their own trips" ON trip_places
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_places.trip_id 
      AND trips.owner_id = auth.uid()
    )
  );

-- Users can only update their own trip_places
CREATE POLICY "Users can update their own trip places" ON trip_places
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_places.trip_id 
      AND trips.owner_id = auth.uid()
    )
  );

-- Users can only delete their own trip_places
CREATE POLICY "Users can delete their own trip places" ON trip_places
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_places.trip_id 
      AND trips.owner_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trip_places_updated_at 
  BEFORE UPDATE ON trip_places 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 