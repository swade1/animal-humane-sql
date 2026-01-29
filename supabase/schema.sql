-- Supabase schema for dog data
CREATE TABLE dogs (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  origin TEXT,
  status TEXT,
  url TEXT,
  intake_date DATE,
  length_of_stay_days INTEGER,
  birthdate DATE,
  age_group TEXT,
  breed TEXT,
  secondary_breed TEXT,
  weight_group TEXT,
  color TEXT,
  bite_quarantine INTEGER,
  returned INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  adopted_date DATE,
  scraped BOOLEAN DEFAULT FALSE
  ,verified_adoption INTEGER DEFAULT 0 -- 0 = not verified, 1 = verified
);

-- Indexes for faster queries
CREATE INDEX idx_dogs_status ON dogs(status);
CREATE INDEX idx_dogs_location ON dogs(location);
CREATE INDEX idx_dogs_age_group ON dogs(age_group);
CREATE INDEX idx_dogs_breed ON dogs(breed);
