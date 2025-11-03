-- SQLite FTS5 (Full-Text Search 5) for Place search
-- Create virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS places_fts USING fts5(
  place_id UNINDEXED,
  name,
  address,
  description,
  content=places,
  content_rowid=rowid
);

-- Create triggers to keep FTS table in sync with places table
-- Trigger: Insert
CREATE TRIGGER IF NOT EXISTS places_fts_insert AFTER INSERT ON places
BEGIN
  INSERT INTO places_fts(place_id, name, address, description)
  VALUES (new.id, new.name, new.address, COALESCE(new.description, ''));
END;

-- Trigger: Update
CREATE TRIGGER IF NOT EXISTS places_fts_update AFTER UPDATE ON places
BEGIN
  UPDATE places_fts
  SET name = new.name,
      address = new.address,
      description = COALESCE(new.description, '')
  WHERE place_id = new.id;
END;

-- Trigger: Delete
CREATE TRIGGER IF NOT EXISTS places_fts_delete AFTER DELETE ON places
BEGIN
  DELETE FROM places_fts WHERE place_id = old.id;
END;

-- Populate existing data
INSERT INTO places_fts(place_id, name, address, description)
SELECT id, name, address, COALESCE(description, '')
FROM places
WHERE id NOT IN (SELECT place_id FROM places_fts);
