CREATE TABLE university (
  university_id SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email_domain  VARCHAR(255) NOT NULL UNIQUE,
  city          VARCHAR(100),
  state         VARCHAR(50)
);

CREATE TABLE users (
  user_id       SERIAL PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES university(university_id),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT,
  display_name  VARCHAR(100) NOT NULL,
  google_id     VARCHAR(255) UNIQUE,
  avatar_url    TEXT,
  auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profile (
  profile_id      SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  bio             TEXT,
  interests       TEXT,
  graduation_year INTEGER
);

-- Seed UNC Charlotte domains
INSERT INTO university (name, email_domain, city, state)
VALUES
  ('University of North Carolina at Charlotte', 'charlotte.edu', 'Charlotte', 'NC'),
  ('University of North Carolina at Charlotte (Alt)', 'uncc.edu', 'Charlotte', 'NC')
ON CONFLICT (email_domain) DO NOTHING;
