-- Add initial location fields to trips table
ALTER TABLE trips 
ADD COLUMN initial_latitude DOUBLE PRECISION,
ADD COLUMN initial_longitude DOUBLE PRECISION;

-- Add comment for documentation
COMMENT ON COLUMN trips.initial_latitude IS 'Initial map center latitude for trip';
COMMENT ON COLUMN trips.initial_longitude IS 'Initial map center longitude for trip';