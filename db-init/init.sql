-- ENUMS 
CREATE TYPE "auth_provider" AS ENUM (
    'local',
    'google'
);


-- USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY DEFAULT,
    name VARCHAR,
    email VARCHAR UNIQUE NOT NULL,
);

-- AUTH TABLE
CREATE TABLE "auth" (
    auth_id SERIAL PRIMARY KEY
    user_id INTEGER,
    provider auth_provider,
    password_hash VARCHAR
);

-- HABITS TABLE
CREATE TABLE habits (
    id SERIAL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    target_type VARCHAR(20) CHECK (target_type IN ('daily', 'weekly', 'custom')) DEFAULT 'daily',
    target_count INT DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) CHECK (status IN ('active', 'archived')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HABIT LOGS
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    completed_count INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(habit_id, log_date) -- Prevent duplicate logs for the same day
);

-- STREAKS
CREATE TABLE streaks (
    id SERIAL,
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_completed_date DATE
);

-- REMINDERS
CREATE TABLE reminders (
    id SERIAL,
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    reminder_time TIME NOT NULL,
    frequency VARCHAR(30) CHECK (frequency IN ('daily', 'specific_days')) DEFAULT 'daily',
    active BOOLEAN DEFAULT TRUE
);

-- CATEGORIES
CREATE TABLE categories (
    id SERIAL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

-- HABIT-CATEGORY JUNCTION TABLE (MANY-TO-MANY)
CREATE TABLE habit_categories (
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (habit_id, category_id)
);
