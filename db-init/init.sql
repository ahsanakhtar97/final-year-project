CREATE TYPE "task_status" AS ENUM (
  'to_do',
  'in_progress',
  'completed'
);
-- users table
CREATE TABLE "users" (
  "user_id" serial PRIMARY KEY,
  "name" varchar,
  "email" varchar NOT NULL,
  "password_hash" varchar
);

-- tasks table
CREATE TABLE "tasks" (
  "task_id" serial PRIMARY KEY,
  "user_id" integer,
  "title" varchar,
  "description" varchar,
  "task_status" task_status DEFAULT 'to_do'
);

ALTER TABLE "tasks" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

-- DATA
-- All passwords are password123
INSERT INTO users (name, email, password_hash) VALUES
('Ali Khan', 'ali@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi'),
('Sara Ahmed', 'sara@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi'),
('John Doe', 'john@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi'),
('Maria Khan', 'maria@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi');

-- Sample tasks data
INSERT INTO tasks (user_id, title, description, task_status) VALUES
-- Tasks for Ali Khan (user_id = 1)
(1, 'Setup project repo', 'Initialize GitHub repository and set up project structure', 'completed'),
(1, 'Design database schema', 'Create ER diagram and define tables', 'in_progress'),
(1, 'Write API documentation', 'Document endpoints for the backend', 'to_do'),

-- Tasks for Sara Ahmed (user_id = 2)
(2, 'Frontend login page', 'Develop login form using React', 'completed'),
(2, 'Integrate API', 'Connect frontend with backend endpoints', 'in_progress'),
(2, 'Write unit tests', 'Test React components with Jest', 'to_do'),

-- Tasks for John Doe (user_id = 3)
(3, 'Create Docker setup', 'Setup Dockerfile and docker-compose for project', 'to_do'),
(3, 'Configure CI/CD', 'Set up GitHub Actions workflow', 'in_progress'),
(3, 'Deploy to staging', 'Deploy application to staging server', 'to_do'),

-- Tasks for Maria Khan (user_id = 4)
(4, 'Design logo', 'Create a logo for the project', 'completed'),
(4, 'Write user guide', 'Prepare documentation for end users', 'in_progress'),
(4, 'Perform usability testing', 'Test application with sample users', 'to_do');
