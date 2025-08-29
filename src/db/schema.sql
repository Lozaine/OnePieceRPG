-- Drop tables if they exist to start with a clean slate
DROP TABLE IF EXISTS character_crew CASCADE;
DROP TABLE IF EXISTS crews CASCADE;
DROP TABLE IF EXISTS character_quests CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- Table to store player information (Discord users)
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    discord_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store character details
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id),
    name VARCHAR(255) NOT NULL,
    race VARCHAR(50) NOT NULL,
    origin VARCHAR(50) NOT NULL,
    dream VARCHAR(100) NOT NULL,
    current_location VARCHAR(100),
    strength INTEGER NOT NULL DEFAULT 1,
    agility INTEGER NOT NULL DEFAULT 1,
    durability INTEGER NOT NULL DEFAULT 1,
    intelligence INTEGER NOT NULL DEFAULT 1,
    power BIGINT NOT NULL DEFAULT 100,
    experience INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store quests
CREATE TABLE quests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    arc VARCHAR(100),
    saga VARCHAR(100),
    quest_type VARCHAR(50) NOT NULL DEFAULT 'Main Story'
);

-- Join table to track character quest progress
CREATE TABLE character_quests (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id),
    quest_id INTEGER NOT NULL REFERENCES quests(id),
    status VARCHAR(50) NOT NULL DEFAULT 'Not Started', -- e.g., 'Not Started', 'In Progress', 'Completed'
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(character_id, quest_id)
);

-- Table to store information about potential crew members
CREATE TABLE crews (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    arc_unlocked VARCHAR(100) NOT NULL,
    tier VARCHAR(50) NOT NULL -- e.g., 'High', 'Mid', 'Low'
);

-- Join table to link characters with their hired crew members
CREATE TABLE character_crew (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id),
    crew_id INTEGER NOT NULL REFERENCES crews(id),
    assigned_to_fleet BOOLEAN NOT NULL DEFAULT false,
    hired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, crew_id)
);

-- Indexes for faster queries
CREATE INDEX idx_players_discord_id ON players(discord_id);
CREATE INDEX idx_characters_player_id ON characters(player_id);
CREATE INDEX idx_character_quests_character_id ON character_quests(character_id);
CREATE INDEX idx_character_crew_character_id ON character_crew(character_id);
