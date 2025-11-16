-- Users Table
CREATE TABLE "users" (
    user_id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

-- All passwords are password123
INSERT INTO users (name, email, password_hash) VALUES
('Ali Khan', 'ali@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi'),
('Sara Ahmed', 'sara@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi'),
('John Doe', 'john@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi'),
('Maria Khan', 'maria@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi');
