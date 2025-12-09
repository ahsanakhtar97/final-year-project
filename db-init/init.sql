-- ENUMS
CREATE TYPE "task_status" AS ENUM (
  'to_do',
  'in_progress',
  'completed'
);

CREATE TYPE "habit_status" AS ENUM (
  'completed',
  'not_completed'
);

-- USERS TABLE
CREATE TABLE "users" (
  "user_id" serial PRIMARY KEY,
  "name" varchar,
  "email" varchar NOT NULL,
  "password_hash" varchar
);

-- TASKS TABLE
CREATE TABLE "tasks" (
  "task_id" serial PRIMARY KEY,
  "user_id" integer,
  "title" varchar,
  "description" varchar,
  "task_status" task_status DEFAULT 'to_do',
  FOREIGN KEY ("user_id") REFERENCES "users" ("user_id")
);

-- CATEGORIES TABLE
CREATE TABLE "categories" (
  "category_id" serial PRIMARY KEY,
  "category_name" varchar NOT NULL
);

-- HABITS TABLE
CREATE TABLE "habits" (
  "habit_id" serial PRIMARY KEY,
  "habit_name" varchar NOT NULL,
  "category_id" int,
  FOREIGN KEY ("category_id") REFERENCES "categories" ("category_id")
);

-- USER_HABITS TABLE
CREATE TABLE "user_habits" (
  "user_habit_id" serial PRIMARY KEY,
  "habit_id" int NOT NULL,
  "user_id" int NOT NULL,
  "start_date" date DEFAULT CURRENT_DATE,
  UNIQUE("user_id", "habit_id"),
  FOREIGN KEY ("habit_id") REFERENCES "habits" ("habit_id"),
  FOREIGN KEY ("user_id") REFERENCES "users" ("user_id")
);

-- HABIT_LOGS TABLE
CREATE TABLE "habit_logs" (
  "log_id" serial PRIMARY KEY,
  "user_habit_id" int NOT NULL,
  "date" date NOT NULL,
  "status" habit_status DEFAULT 'not_completed',
  UNIQUE ("user_habit_id", "date"),
  FOREIGN KEY ("user_habit_id") REFERENCES "user_habits" ("user_habit_id")
);

-- SAMPLE DATA
INSERT INTO categories (category_name) VALUES
('Health & Fitness'),
('Productivity'),
('Learning'),
('Lifestyle'),
('Finance'),
('Mental Wellbeing');

INSERT INTO users (name, email, password_hash) VALUES
('Ali Khan', 'ali@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi'),
('Sara Ahmed', 'sara@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi'),
('John Doe', 'john@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi'),
('Maria Khan', 'maria@example.com', '$2a$12$SY6elPZUwn4r05PotfWeleVbxY1Oxgl697F38GVIg0yz2LFQ3gAJi');

INSERT INTO tasks (user_id, title, description, task_status) VALUES
(1, 'Setup project repo', 'Initialize GitHub repository and set up project structure', 'completed'),
(1, 'Design database schema', 'Create ER diagram and define tables', 'in_progress'),
(1, 'Write API documentation', 'Document endpoints for the backend', 'to_do'),

(2, 'Frontend login page', 'Develop login form using React', 'completed'),
(2, 'Integrate API', 'Connect frontend with backend endpoints', 'in_progress'),
(2, 'Write unit tests', 'Test React components with Jest', 'to_do'),

(3, 'Create Docker setup', 'Setup Dockerfile and docker-compose for project', 'to_do'),
(3, 'Configure CI/CD', 'Set up GitHub Actions workflow', 'in_progress'),
(3, 'Deploy to staging', 'Deploy application to staging server', 'to_do'),

(4, 'Design logo', 'Create a logo for the project', 'completed'),
(4, 'Write user guide', 'Prepare documentation for end users', 'in_progress'),
(4, 'Perform usability testing', 'Test application with sample users', 'to_do');

INSERT INTO habits (habit_name, category_id) VALUES
-- Health
('Drink 8 glasses of water', 1),
('Morning walk', 1),
('Workout 30 minutes', 1),
('Sleep by 11 PM', 1),

-- Productivity
('Plan my day', 2),
('Declutter workspace', 2),
('Complete a to-do task', 2),

-- Learning
('Read 10 pages', 3),
('Practice coding 30 mins', 3),
('Watch a tutorial', 3),

-- Lifestyle
('Clean my room', 4),
('Do laundry', 4),
('Cook a meal at home', 4),

-- Finance
('Log expenses', 5),
('No spend day', 5),

-- Mental Wellbeing
('Meditation 10 min', 6),
('Write gratitude journal', 6);

INSERT INTO user_habits (habit_id, user_id, start_date) VALUES
-- Ali (User 1)
(1, 1, '2025-12-01'),
(5, 1, '2025-12-01'),
(9, 1, '2025-12-01'),
(14, 1, '2025-12-01'),

-- Sara (User 2)
(2, 2, '2025-12-01'),
(6, 2, '2025-12-01'),
(10, 2, '2025-12-01'),
(16, 2, '2025-12-01'),

-- John (User 3)
(3, 3, '2025-12-01'),
(7, 3, '2025-12-01'),
(11, 3, '2025-12-01'),
(15, 3, '2025-12-01'),

-- Maria (User 4)
(4, 4, '2025-12-01'),
(8, 4, '2025-12-01'),
(12, 4, '2025-12-01'),
(17, 4, '2025-12-01');


-- habit logs for Ali Only
INSERT INTO habit_logs (user_habit_id, date, status) VALUES
-- user_habit_id 1 = (Ali, Drink water)
(1, '2025-12-01', 'completed'),
(1, '2025-12-02', 'completed'),
(1, '2025-12-03', 'not_completed'),
(1, '2025-12-04', 'completed'),
(1, '2025-12-05', 'completed'),
(1, '2025-12-06', 'not_completed'),
(1, '2025-12-07', 'completed'),

-- user_habit_id 2 = (Ali, Plan my day)
(2, '2025-12-01', 'completed'),
(2, '2025-12-02', 'not_completed'),
(2, '2025-12-03', 'completed'),
(2, '2025-12-04', 'completed'),
(2, '2025-12-05', 'not_completed'),
(2, '2025-12-06', 'completed'),
(2, '2025-12-07', 'completed'),

-- user_habit_id 3 = (Ali, Coding 30 mins)
(3, '2025-12-01', 'completed'),
(3, '2025-12-02', 'completed'),
(3, '2025-12-03', 'completed'),
(3, '2025-12-04', 'not_completed'),
(3, '2025-12-05', 'completed'),
(3, '2025-12-06', 'completed'),
(3, '2025-12-07', 'not_completed'),

-- user_habit_id 4 = (Ali, Log expenses)
(4, '2025-12-01', 'not_completed'),
(4, '2025-12-02', 'not_completed'),
(4, '2025-12-03', 'completed'),
(4, '2025-12-04', 'completed'),
(4, '2025-12-05', 'completed'),
(4, '2025-12-06', 'not_completed'),
(4, '2025-12-07', 'completed');
