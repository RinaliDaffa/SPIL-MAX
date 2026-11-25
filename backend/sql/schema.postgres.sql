-- ============================================================================
-- SPIL MAX (E-Learning Hub & Edu Stream) — Enterprise PostgreSQL Schema
-- Handover reference for PT Salam Pacific Indonesia Lines IT Infrastructure Team.
-- Matches the SQLite development/embedded schema 1-to-1.
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
  employee_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  role VARCHAR(160) NOT NULL,
  division VARCHAR(160) NOT NULL,
  location VARCHAR(160) NOT NULL,
  annual_target_hours INTEGER NOT NULL DEFAULT 150,
  base_completed_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(96) PRIMARY KEY,
  slug VARCHAR(120) UNIQUE NOT NULL,
  title VARCHAR(240) NOT NULL,
  competency VARCHAR(200) NOT NULL,
  kind VARCHAR(64) NOT NULL,
  year INTEGER NOT NULL DEFAULT 2026,
  badge VARCHAR(64),
  mandatory_from_superior BOOLEAN NOT NULL DEFAULT FALSE,
  top_rank INTEGER,
  featured_in_hero BOOLEAN NOT NULL DEFAULT FALSE,
  hero_tagline TEXT,
  summary TEXT NOT NULL,
  objectives_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  poster VARCHAR(512) NOT NULL,
  backdrop VARCHAR(512) NOT NULL,
  total_duration_text VARCHAR(64) NOT NULL,
  division VARCHAR(160) NOT NULL,
  instructors_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS episodes (
  id VARCHAR(96) PRIMARY KEY,
  module_id VARCHAR(96) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL DEFAULT 1,
  level_label VARCHAR(120) NOT NULL,
  title VARCHAR(240) NOT NULL,
  description TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 600,
  duration_text VARCHAR(64) NOT NULL,
  still VARCHAR(512) NOT NULL,
  renditions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  captions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  chapters_vtt VARCHAR(512) NOT NULL DEFAULT '',
  intro_end_seconds INTEGER,
  credits_start_seconds INTEGER,
  key_takeaways_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episodes_module_level ON episodes(module_id, level_number);

CREATE TABLE IF NOT EXISTS playback_progress (
  employee_id VARCHAR(64) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  module_id VARCHAR(96) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  module_slug VARCHAR(120) NOT NULL,
  episode_id VARCHAR(96) NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  position_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  hidden_from_continue BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (employee_id, module_id, episode_id)
);

CREATE TABLE IF NOT EXISTS episode_completions (
  employee_id VARCHAR(64) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  module_id VARCHAR(96) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  episode_id VARCHAR(96) NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (employee_id, module_id, episode_id)
);

CREATE TABLE IF NOT EXISTS employee_watchlist (
  employee_id VARCHAR(64) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  module_id VARCHAR(96) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  added_at BIGINT NOT NULL,
  PRIMARY KEY (employee_id, module_id)
);
