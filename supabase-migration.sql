-- ============================================================
-- ФОРСАЖ: Database Migration for Supabase
-- Run this SQL in Supabase SQL Editor (Dashboard -> SQL Editor)
-- ============================================================

-- 1. TABLES
-- ============================================================

-- Crews table
CREATE TABLE crews (
  id              SERIAL PRIMARY KEY,
  team_name       TEXT NOT NULL,
  driver_name     TEXT NOT NULL,
  driver_avatar   TEXT NOT NULL DEFAULT '',
  navigator_name  TEXT NOT NULL,
  navigator_avatar TEXT NOT NULL DEFAULT '',
  color           TEXT NOT NULL DEFAULT '#FF3366',
  glow_color      TEXT NOT NULL DEFAULT 'rgba(255, 51, 102, 0.6)',
  checkpoint1     BOOLEAN NOT NULL DEFAULT false,
  checkpoint2     BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Metric type enum
CREATE TYPE metric_type AS ENUM ('connected_points', 'sales_volume', 'sku_count');

-- Crew metrics (normalized: one row per crew per metric)
CREATE TABLE crew_metrics (
  id         SERIAL PRIMARY KEY,
  crew_id    INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  metric     metric_type NOT NULL,
  target     NUMERIC NOT NULL DEFAULT 0,
  fact       NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (crew_id, metric)
);

-- Weekly history snapshots
CREATE TABLE weekly_history (
  id               SERIAL PRIMARY KEY,
  crew_id          INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  week             INTEGER NOT NULL,
  connected_points NUMERIC NOT NULL DEFAULT 0,
  sales_volume     NUMERIC NOT NULL DEFAULT 0,
  sku_count        NUMERIC NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (crew_id, week)
);

-- Segment key enum
CREATE TYPE segment_key AS ENUM ('warmup', 'lap1', 'lap2', 'lap3');

-- Segments configuration (global, 4 rows)
CREATE TABLE segments (
  id         SERIAL PRIMARY KEY,
  key        segment_key NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  weight     NUMERIC NOT NULL DEFAULT 0.25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-crew segment scores
CREATE TABLE crew_segment_scores (
  id          SERIAL PRIMARY KEY,
  crew_id     INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  segment_key segment_key NOT NULL,
  target      NUMERIC NOT NULL DEFAULT 0,
  fact        NUMERIC NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (crew_id, segment_key)
);


-- 2. AUTO-UPDATE TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crews_updated_at
  BEFORE UPDATE ON crews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crew_metrics_updated_at
  BEFORE UPDATE ON crew_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER segments_updated_at
  BEFORE UPDATE ON segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crew_segment_scores_updated_at
  BEFORE UPDATE ON crew_segment_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_segment_scores ENABLE ROW LEVEL SECURITY;

-- Public read (for the public dashboard)
CREATE POLICY "Public can read crews" ON crews
  FOR SELECT USING (true);

CREATE POLICY "Public can read crew_metrics" ON crew_metrics
  FOR SELECT USING (true);

CREATE POLICY "Public can read weekly_history" ON weekly_history
  FOR SELECT USING (true);

CREATE POLICY "Public can read segments" ON segments
  FOR SELECT USING (true);

CREATE POLICY "Public can read crew_segment_scores" ON crew_segment_scores
  FOR SELECT USING (true);

-- Admin write (authenticated users only)
CREATE POLICY "Admin can manage crews" ON crews
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage crew_metrics" ON crew_metrics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage weekly_history" ON weekly_history
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage segments" ON segments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage crew_segment_scores" ON crew_segment_scores
  FOR ALL USING (auth.role() = 'authenticated');


-- 4. RPC FUNCTION: get_crews_full
-- Returns all crews with metrics, weekly history, and segment scores
-- in the exact shape the frontend Crew type expects
-- ============================================================

CREATE OR REPLACE FUNCTION get_crews_full()
RETURNS JSON AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT
      c.id,
      c.team_name AS "teamName",
      json_build_object('name', c.driver_name, 'avatar', c.driver_avatar) AS driver,
      json_build_object('name', c.navigator_name, 'avatar', c.navigator_avatar) AS navigator,
      c.color,
      c.glow_color AS "glowColor",
      c.checkpoint1,
      c.checkpoint2,
      json_build_object(
        'connectedPoints', json_build_object(
          'target', COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'connected_points'), 0),
          'fact', COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'connected_points'), 0)
        ),
        'salesVolume', json_build_object(
          'target', COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'sales_volume'), 0),
          'fact', COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'sales_volume'), 0)
        ),
        'skuCount', json_build_object(
          'target', COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'sku_count'), 0),
          'fact', COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'sku_count'), 0)
        )
      ) AS metrics,
      (
        SELECT COALESCE(json_agg(
          json_build_object(
            'week', wh.week,
            'connectedPoints', wh.connected_points,
            'salesVolume', wh.sales_volume,
            'skuCount', wh.sku_count
          ) ORDER BY wh.week
        ), '[]'::json)
        FROM weekly_history wh WHERE wh.crew_id = c.id
      ) AS "weeklyHistory",
      json_build_object(
        'warmup', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'warmup'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'warmup'), 0)
        ),
        'lap1', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap1'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap1'), 0)
        ),
        'lap2', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap2'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap2'), 0)
        ),
        'lap3', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap3'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap3'), 0)
        )
      ) AS "segmentScores"
    FROM crews c
    ORDER BY c.sort_order, c.id
  ) t;
$$ LANGUAGE sql STABLE;


-- 5. SEED DATA: Segments
-- ============================================================

INSERT INTO segments (key, label, start_date, end_date, weight) VALUES
  ('warmup', 'Прогревочный круг (Февраль)', '2026-02-16', '2026-02-28', 0.20),
  ('lap1', 'Этап 1 (Март)', '2026-03-01', '2026-03-31', 0.27),
  ('lap2', 'Этап 2 (Апрель)', '2026-04-01', '2026-04-30', 0.27),
  ('lap3', 'Этап 3 (Май)', '2026-05-01', '2026-05-31', 0.26);


-- 6. ENABLE REALTIME
-- ============================================================
-- Go to Supabase Dashboard -> Database -> Replication
-- and enable realtime for these tables:
-- - crews
-- - crew_metrics
-- - crew_segment_scores
-- - weekly_history


-- 7. CREW AWARDS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS crew_awards (
  id          SERIAL PRIMARY KEY,
  crew_id     INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  award_label TEXT NOT NULL,
  category    TEXT NOT NULL,
  place       INTEGER NOT NULL DEFAULT 0,
  month       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(crew_id, award_label, month)
);

ALTER TABLE crew_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read crew_awards" ON crew_awards
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage crew_awards" ON crew_awards
  FOR ALL USING (auth.role() = 'authenticated');


-- 8. UPDATED RPC: get_crews_full (with awards)
-- ============================================================

CREATE OR REPLACE FUNCTION get_crews_full()
RETURNS JSON AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT
      c.id,
      c.team_name AS "teamName",
      json_build_object('name', c.driver_name, 'avatar', c.driver_avatar) AS driver,
      json_build_object('name', c.navigator_name, 'avatar', c.navigator_avatar) AS navigator,
      c.color,
      c.glow_color AS "glowColor",
      c.checkpoint1,
      c.checkpoint2,
      json_build_object(
        'connectedPoints', json_build_object(
          'target', COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'connected_points'), 0),
          'fact', COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'connected_points'), 0)
        ),
        'salesVolume', json_build_object(
          'target', COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'sales_volume'), 0),
          'fact', COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'sales_volume'), 0)
        ),
        'skuCount', json_build_object(
          'target', COALESCE((SELECT target FROM crew_metrics WHERE crew_id = c.id AND metric = 'sku_count'), 0),
          'fact', COALESCE((SELECT fact FROM crew_metrics WHERE crew_id = c.id AND metric = 'sku_count'), 0)
        )
      ) AS metrics,
      (
        SELECT COALESCE(json_agg(
          json_build_object(
            'week', wh.week,
            'connectedPoints', wh.connected_points,
            'salesVolume', wh.sales_volume,
            'skuCount', wh.sku_count
          ) ORDER BY wh.week
        ), '[]'::json)
        FROM weekly_history wh WHERE wh.crew_id = c.id
      ) AS "weeklyHistory",
      json_build_object(
        'warmup', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'warmup'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'warmup'), 0)
        ),
        'lap1', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap1'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap1'), 0)
        ),
        'lap2', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap2'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap2'), 0)
        ),
        'lap3', json_build_object(
          'target', COALESCE((SELECT target FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap3'), 0),
          'fact', COALESCE((SELECT fact FROM crew_segment_scores WHERE crew_id = c.id AND segment_key = 'lap3'), 0)
        )
      ) AS "segmentScores",
      (
        SELECT COALESCE(json_agg(
          json_build_object(
            'label', ca.award_label,
            'category', ca.category,
            'place', ca.place,
            'month', ca.month
          )
        ), '[]'::json)
        FROM crew_awards ca WHERE ca.crew_id = c.id
      ) AS awards
    FROM crews c
    ORDER BY c.sort_order, c.id
  ) t;
$$ LANGUAGE sql STABLE;


-- ============================================================
-- DONE! Now create an admin user:
-- Go to Supabase Dashboard -> Authentication -> Users -> Add User
-- Set email and password for the admin
-- ============================================================
