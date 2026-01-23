-- Table to track changes/events for each dog
CREATE TABLE dog_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dog_id BIGINT REFERENCES dogs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g., 'location_change', 'status_update'
  old_value TEXT,
  new_value TEXT,
  event_time TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Index for fast lookup by dog
CREATE INDEX idx_dog_history_dog_id ON dog_history(dog_id);

-- Example usage:
-- When a dog's location changes, insert a row:
-- INSERT INTO dog_history (dog_id, event_type, old_value, new_value, notes)
-- VALUES (123, 'location_change', 'Kennel A', 'Kennel B', 'Moved for cleaning');
