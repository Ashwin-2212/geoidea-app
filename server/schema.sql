-- =========================================================
-- CivicPulse Smart City & Community Innovation Platform Schema
-- PostGIS Geospatial & Role-Based Access Control Schema
-- =========================================================

-- 1. Enable PostGIS & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'citizen', -- 'citizen', 'moderator', 'official', 'admin'
    department VARCHAR(100),
    avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    bio TEXT DEFAULT 'Active CivicPulse contributor.',
    points INT DEFAULT 10,
    badges TEXT[] DEFAULT ARRAY['Civic Pioneer'],
    is_verified BOOLEAN DEFAULT TRUE,
    refresh_token TEXT,
    reset_token VARCHAR(20),
    language_preference VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Ideas / Civic Issues Table with PostGIS Geography support
CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Community',
    severity VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- 'submitted', 'verified', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed'
    department_assigned VARCHAR(100),
    assigned_official_name VARCHAR(255),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326),
    address VARCHAR(255) DEFAULT 'Selected Map Location',
    image_url TEXT,
    resolution_notes TEXT,
    resolution_image_url TEXT,
    ai_confidence_score INT DEFAULT 90,
    ai_detected_tags TEXT[] DEFAULT ARRAY['Smart City'],
    status_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Auto populate PostGIS location geometry on insert/update
CREATE OR REPLACE FUNCTION update_idea_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_idea_location ON ideas;
CREATE TRIGGER trigger_update_idea_location
BEFORE INSERT OR UPDATE ON ideas
FOR EACH ROW EXECUTE FUNCTION update_idea_location();

-- 4. Create Likes / Upvotes Table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_idea_like UNIQUE (user_id, idea_id)
);

-- 5. Create Community Verifications Table
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT DEFAULT 'Verified on site.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_idea_verification UNIQUE (user_id, idea_id)
);

-- 6. Create Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for spatial querying & search performance
CREATE INDEX IF NOT EXISTS idx_ideas_location ON ideas USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_ideas_lat_lng ON ideas(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_severity ON ideas(severity);
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_likes_idea_id ON likes(idea_id);
CREATE INDEX IF NOT EXISTS idx_verifications_idea_id ON verifications(idea_id);

