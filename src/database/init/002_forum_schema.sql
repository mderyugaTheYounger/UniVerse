-- ============================================================================
-- Forum DB Init: 002_forum_schema.sql
-- Database: forum_db (port 5437)
-- Tables: reviews, posted_course_plans, roommate_posts, roommate_post_comments
-- ============================================================================

-- Polymorphic reviews covering map_tack, course, major, minor, course_plan targets.
-- Cross-DB foreign keys (user_id, target_id) are validated at the API layer.
CREATE TABLE IF NOT EXISTS reviews (
  review_id   SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('map_tack', 'course', 'major', 'minor', 'course_plan')),
  target_id   VARCHAR(64) NOT NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       VARCHAR(150),
  comment     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user   ON reviews (user_id);
-- One review per user per target
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_target_review ON reviews (user_id, target_type, target_id);

-- User-published course plans shared with the community.
-- plan_data JSONB shape: [{ year: int, semester: 'fall'|'spring'|'summer', courses: uuid[] }]
CREATE TABLE IF NOT EXISTS posted_course_plans (
  plan_id     SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  major_id    VARCHAR(64),
  plan_data   JSONB NOT NULL,
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_plans_user  ON posted_course_plans (user_id);
CREATE INDEX IF NOT EXISTS idx_course_plans_major ON posted_course_plans (major_id);

-- Active roommate-finder forum listings.
CREATE TABLE IF NOT EXISTS roommate_posts (
  post_id              SERIAL PRIMARY KEY,
  user_id              INTEGER NOT NULL,
  title                VARCHAR(200) NOT NULL,
  description          TEXT NOT NULL,
  budget_max           INTEGER CHECK (budget_max IS NULL OR budget_max >= 0),
  housing_status       VARCHAR(30) CHECK (housing_status IS NULL OR housing_status IN ('have_place', 'need_place', 'flexible')),
  location_preference  VARCHAR(150),
  move_in_term         VARCHAR(50),
  sleep_schedule       VARCHAR(20) CHECK (sleep_schedule IS NULL OR sleep_schedule IN ('early_bird', 'night_owl', 'flexible')),
  cleanliness          VARCHAR(20) CHECK (cleanliness IS NULL OR cleanliness IN ('neat', 'moderate', 'relaxed')),
  pets_ok              BOOLEAN NOT NULL DEFAULT FALSE,
  smoking_ok           BOOLEAN NOT NULL DEFAULT FALSE,
  contact_info         VARCHAR(150),
  status               VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roommate_posts_status ON roommate_posts (status);
CREATE INDEX IF NOT EXISTS idx_roommate_posts_budget ON roommate_posts (budget_max);
CREATE INDEX IF NOT EXISTS idx_roommate_posts_user   ON roommate_posts (user_id);

-- Threaded comments on roommate posts (self-referential for replies).
CREATE TABLE IF NOT EXISTS roommate_post_comments (
  comment_id        SERIAL PRIMARY KEY,
  post_id           INTEGER NOT NULL REFERENCES roommate_posts (post_id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id           INTEGER NOT NULL,
  parent_comment_id INTEGER REFERENCES roommate_post_comments (comment_id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roommate_comments_post ON roommate_post_comments (post_id);
